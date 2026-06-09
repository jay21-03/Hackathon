package com.seal.hackathon.registration.controller;

import com.seal.hackathon.common.response.ApiResponse;
import com.seal.hackathon.registration.dto.AuditLogResponse;
import com.seal.hackathon.registration.service.RegistrationService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/events")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class AdminAuditController {

    private final RegistrationService registrationService;

    @GetMapping("/{eventId}/audit-logs")
    public ApiResponse<List<AuditLogResponse>> getEventAuditLogs(
            @PathVariable Long eventId,
            @RequestParam(defaultValue = "50") int limit) {
        return ApiResponse.ok(registrationService.getEventAuditLogs(eventId, limit));
    }
}
