package com.seal.hackathon.mail.controller;

import com.seal.hackathon.common.response.ApiResponse;
import com.seal.hackathon.mail.dto.EmailTemplateResponse;
import com.seal.hackathon.mail.dto.SaveEmailTemplateRequest;
import com.seal.hackathon.mail.enums.EmailTemplateKey;
import com.seal.hackathon.mail.service.EmailTemplateService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/events/{eventId}/email-templates")
@RequiredArgsConstructor
public class EmailTemplateController {

    private final EmailTemplateService emailTemplateService;

    @GetMapping
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<List<EmailTemplateResponse>> list(@PathVariable Long eventId) {
        return ApiResponse.ok(emailTemplateService.listForEvent(eventId));
    }

    @GetMapping("/{templateKey}")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<EmailTemplateResponse> get(
            @PathVariable Long eventId, @PathVariable EmailTemplateKey templateKey) {
        return ApiResponse.ok(emailTemplateService.getForEvent(eventId, templateKey));
    }

    @PutMapping("/{templateKey}")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<EmailTemplateResponse> save(
            @PathVariable Long eventId,
            @PathVariable EmailTemplateKey templateKey,
            @Valid @RequestBody SaveEmailTemplateRequest request) {
        return ApiResponse.ok(emailTemplateService.saveForEvent(eventId, templateKey, request));
    }

    @PostMapping("/{templateKey}/reset")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<EmailTemplateResponse> reset(
            @PathVariable Long eventId, @PathVariable EmailTemplateKey templateKey) {
        return ApiResponse.ok(emailTemplateService.resetForEvent(eventId, templateKey));
    }
}
