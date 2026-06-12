package com.seal.hackathon.scoring.controller;

import com.seal.hackathon.common.response.ApiResponse;
import com.seal.hackathon.scoring.dto.CriteriaTemplateResponse;
import com.seal.hackathon.scoring.dto.CriteriaTemplateSummaryResponse;
import com.seal.hackathon.scoring.dto.SaveCriteriaTemplateRequest;
import com.seal.hackathon.scoring.service.CriteriaTemplateService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/criteria-templates")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class AdminCriteriaTemplateController {

    private final CriteriaTemplateService criteriaTemplateService;

    @GetMapping
    public ApiResponse<List<CriteriaTemplateSummaryResponse>> listTemplates() {
        return ApiResponse.ok(criteriaTemplateService.listTemplates());
    }

    @GetMapping("/{templateId}")
    public ApiResponse<CriteriaTemplateResponse> getTemplate(@PathVariable Long templateId) {
        return ApiResponse.ok(criteriaTemplateService.getTemplate(templateId));
    }

    @PostMapping
    public ApiResponse<CriteriaTemplateResponse> createTemplate(
            @Valid @RequestBody SaveCriteriaTemplateRequest request) {
        return ApiResponse.ok(criteriaTemplateService.createTemplate(request));
    }

    @PutMapping("/{templateId}")
    public ApiResponse<CriteriaTemplateResponse> updateTemplate(
            @PathVariable Long templateId,
            @Valid @RequestBody SaveCriteriaTemplateRequest request) {
        return ApiResponse.ok(criteriaTemplateService.updateTemplate(templateId, request));
    }

    @DeleteMapping("/{templateId}")
    public ApiResponse<Void> deleteTemplate(@PathVariable Long templateId) {
        criteriaTemplateService.deleteTemplate(templateId);
        return ApiResponse.ok(null);
    }
}
