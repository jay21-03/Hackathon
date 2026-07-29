package com.seal.hackathon.common.util;

import com.seal.hackathon.scoring.dto.CriteriaRequestItem;
import com.seal.hackathon.scoring.dto.LevelDescriptorDto;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.util.StringUtils;

public final class RubricValidation {

    private static final BigDecimal WEIGHT_TARGET = new BigDecimal("100");
    private static final BigDecimal WEIGHT_TOLERANCE = new BigDecimal("0.001");

    private RubricValidation() {}

    public static boolean isWeightSumValid(List<CriteriaRequestItem> criteria) {
        if (criteria == null || criteria.isEmpty()) {
            return true;
        }
        BigDecimal total = BigDecimal.ZERO;
        for (CriteriaRequestItem item : criteria) {
            if (item == null || item.getWeight() == null) {
                return true;
            }
            total = total.add(item.getWeight());
        }
        return total.subtract(WEIGHT_TARGET).abs().compareTo(WEIGHT_TOLERANCE) <= 0;
    }

    public static boolean hasUniqueCodesAndNames(List<CriteriaRequestItem> criteria) {
        if (criteria == null || criteria.isEmpty()) {
            return true;
        }
        Set<String> codes = new HashSet<>();
        Set<String> names = new HashSet<>();
        for (CriteriaRequestItem item : criteria) {
            if (item == null) {
                continue;
            }
            if (StringUtils.hasText(item.getCode()) && !codes.add(item.getCode().trim())) {
                return false;
            }
            if (StringUtils.hasText(item.getName()) && !names.add(item.getName().trim())) {
                return false;
            }
        }
        return true;
    }

    public static boolean hasValidLevelScoreRanges(CriteriaRequestItem item) {
        if (item == null || item.getLevelDescriptors() == null || item.getLevelDescriptors().isEmpty()) {
            return true;
        }
        if (item.getMinScore() == null || item.getMaxScore() == null) {
            return true;
        }
        List<LevelDescriptorDto> sorted = item.getLevelDescriptors().stream()
                .filter(level -> level != null && level.getMinScore() != null && level.getMaxScore() != null)
                .sorted(Comparator.comparing(LevelDescriptorDto::getMinScore)
                        .thenComparing(LevelDescriptorDto::getMaxScore))
                .toList();
        if (sorted.size() != item.getLevelDescriptors().size()) {
            return true;
        }
        for (int index = 0; index < sorted.size(); index++) {
            LevelDescriptorDto current = sorted.get(index);
            if (current.getMaxScore().compareTo(current.getMinScore()) <= 0) {
                return false;
            }
            if (current.getMinScore().compareTo(item.getMinScore()) < 0
                    || current.getMaxScore().compareTo(item.getMaxScore()) > 0) {
                return false;
            }
            if (index > 0) {
                LevelDescriptorDto previous = sorted.get(index - 1);
                if (previous.getMaxScore().compareTo(current.getMinScore()) > 0) {
                    return false;
                }
            }
        }
        return true;
    }
}
