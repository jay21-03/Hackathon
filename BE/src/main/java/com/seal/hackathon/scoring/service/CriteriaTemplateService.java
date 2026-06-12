package com.seal.hackathon.scoring.service;

import com.seal.hackathon.scoring.dto.CriteriaRequestItem;
import com.seal.hackathon.scoring.dto.CriteriaTemplateResponse;
import com.seal.hackathon.scoring.dto.CriteriaTemplateSummaryResponse;
import com.seal.hackathon.scoring.dto.RubricResponse;
import com.seal.hackathon.scoring.dto.SaveCriteriaTemplateRequest;
import com.seal.hackathon.scoring.dto.SaveRubricRequest;
import com.seal.hackathon.scoring.entity.CriteriaTemplate;
import com.seal.hackathon.scoring.entity.CriteriaTemplateItem;
import com.seal.hackathon.scoring.repository.CriteriaTemplateItemRepository;
import com.seal.hackathon.scoring.repository.CriteriaTemplateRepository;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class CriteriaTemplateService {

    private static final BigDecimal WEIGHT_TARGET = new BigDecimal("100");
    private static final BigDecimal WEIGHT_TOLERANCE = new BigDecimal("0.001");

    private final CriteriaTemplateRepository criteriaTemplateRepository;
    private final CriteriaTemplateItemRepository criteriaTemplateItemRepository;
    private final ScoringService scoringService;

    @Transactional(readOnly = true)
    public List<CriteriaTemplateSummaryResponse> listTemplates() {
        return criteriaTemplateRepository.findAllByOrderBySystemDefaultDescNameAsc().stream()
                .map(template -> {
                    int count = criteriaTemplateItemRepository
                            .findByTemplateIdOrderBySortOrderAsc(template.getId())
                            .size();
                    return CriteriaTemplateSummaryResponse.builder()
                            .id(template.getId())
                            .name(template.getName())
                            .description(template.getDescription())
                            .systemDefault(template.getSystemDefault())
                            .criteriaCount(count)
                            .createdAt(template.getCreatedAt())
                            .updatedAt(template.getUpdatedAt())
                            .build();
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public CriteriaTemplateResponse getTemplate(Long templateId) {
        CriteriaTemplate template = criteriaTemplateRepository.findById(templateId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "TEMPLATE_NOT_FOUND"));
        return toResponse(template);
    }

    @Transactional
    public CriteriaTemplateResponse createTemplate(SaveCriteriaTemplateRequest request) {
        validateTemplateCriteria(request.getCriteria());
        OffsetDateTime now = OffsetDateTime.now();
        CriteriaTemplate template = criteriaTemplateRepository.save(CriteriaTemplate.builder()
                .name(request.getName().trim())
                .description(normalizeNullable(request.getDescription()))
                .systemDefault(false)
                .createdAt(now)
                .updatedAt(now)
                .build());
        saveTemplateItems(template.getId(), request.getCriteria());
        return toResponse(template);
    }

    @Transactional
    public CriteriaTemplateResponse updateTemplate(Long templateId, SaveCriteriaTemplateRequest request) {
        CriteriaTemplate template = criteriaTemplateRepository.findById(templateId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "TEMPLATE_NOT_FOUND"));
        validateTemplateCriteria(request.getCriteria());
        template.setName(request.getName().trim());
        template.setDescription(normalizeNullable(request.getDescription()));
        template.setUpdatedAt(OffsetDateTime.now());
        criteriaTemplateRepository.save(template);
        criteriaTemplateItemRepository.deleteByTemplateId(templateId);
        saveTemplateItems(templateId, request.getCriteria());
        return toResponse(template);
    }

    @Transactional
    public void deleteTemplate(Long templateId) {
        CriteriaTemplate template = criteriaTemplateRepository.findById(templateId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "TEMPLATE_NOT_FOUND"));
        if (Boolean.TRUE.equals(template.getSystemDefault())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "SYSTEM_TEMPLATE_CANNOT_DELETE");
        }
        criteriaTemplateItemRepository.deleteByTemplateId(templateId);
        criteriaTemplateRepository.delete(template);
    }

    @Transactional
    public RubricResponse applyTemplateToRound(Long roundId, Long templateId, boolean replaceExisting) {
        List<CriteriaRequestItem> items = toCriteriaRequestItems(templateId);
        SaveRubricRequest request = new SaveRubricRequest();
        request.setReplaceExisting(replaceExisting);
        request.setCriteria(items);
        return scoringService.saveRubric(roundId, request);
    }

    @Transactional(readOnly = true)
    public List<CriteriaRequestItem> toCriteriaRequestItems(Long templateId) {
        if (!criteriaTemplateRepository.existsById(templateId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "TEMPLATE_NOT_FOUND");
        }
        return criteriaTemplateItemRepository.findByTemplateIdOrderBySortOrderAsc(templateId).stream()
                .map(this::toCriteriaRequestItem)
                .toList();
    }

    private void saveTemplateItems(Long templateId, List<CriteriaRequestItem> items) {
        int order = 0;
        for (CriteriaRequestItem item : items) {
            int sortOrder = item.getSortOrder() != null ? item.getSortOrder() : ++order;
            criteriaTemplateItemRepository.save(CriteriaTemplateItem.builder()
                    .templateId(templateId)
                    .code(item.getCode().trim())
                    .name(item.getName().trim())
                    .description(item.getDescription())
                    .weight(item.getWeight())
                    .minScore(item.getMinScore())
                    .maxScore(item.getMaxScore())
                    .sortOrder(sortOrder)
                    .levelDescriptors(item.getLevelDescriptors())
                    .build());
        }
    }

    private CriteriaTemplateResponse toResponse(CriteriaTemplate template) {
        List<CriteriaRequestItem> criteria = criteriaTemplateItemRepository
                .findByTemplateIdOrderBySortOrderAsc(template.getId()).stream()
                .map(this::toCriteriaRequestItem)
                .toList();
        return CriteriaTemplateResponse.builder()
                .id(template.getId())
                .name(template.getName())
                .description(template.getDescription())
                .systemDefault(template.getSystemDefault())
                .criteria(criteria)
                .createdAt(template.getCreatedAt())
                .updatedAt(template.getUpdatedAt())
                .build();
    }

    private CriteriaRequestItem toCriteriaRequestItem(CriteriaTemplateItem item) {
        CriteriaRequestItem dto = new CriteriaRequestItem();
        dto.setCode(item.getCode());
        dto.setName(item.getName());
        dto.setDescription(item.getDescription());
        dto.setWeight(item.getWeight());
        dto.setMinScore(item.getMinScore());
        dto.setMaxScore(item.getMaxScore());
        dto.setSortOrder(item.getSortOrder());
        dto.setLevelDescriptors(item.getLevelDescriptors());
        return dto;
    }

    private void validateTemplateCriteria(List<CriteriaRequestItem> items) {
        if (items == null || items.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CRITERIA_REQUIRED");
        }
        Set<String> codes = new HashSet<>();
        Set<String> names = new HashSet<>();
        BigDecimal totalWeight = BigDecimal.ZERO;
        for (CriteriaRequestItem item : items) {
            if (!StringUtils.hasText(item.getCode()) || !codes.add(item.getCode().trim())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "DUPLICATE_CRITERIA");
            }
            if (!StringUtils.hasText(item.getName()) || !names.add(item.getName().trim())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "DUPLICATE_CRITERIA");
            }
            if (item.getLevelDescriptors() == null || item.getLevelDescriptors().size() != 4) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_LEVEL_DESCRIPTORS");
            }
            totalWeight = totalWeight.add(item.getWeight());
        }
        if (totalWeight.subtract(WEIGHT_TARGET).abs().compareTo(WEIGHT_TOLERANCE) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_WEIGHT_SUM");
        }
    }

    private String normalizeNullable(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }
}
