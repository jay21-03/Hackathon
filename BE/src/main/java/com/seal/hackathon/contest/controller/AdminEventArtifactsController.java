package com.seal.hackathon.contest.controller;

import com.seal.hackathon.common.response.ApiResponse;
import com.seal.hackathon.contest.dto.EventArtifactsSummaryResponse;
import com.seal.hackathon.contest.service.EventArtifactsService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/events")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class AdminEventArtifactsController {

    private final EventArtifactsService eventArtifactsService;

    @GetMapping("/{eventId}/artifacts-summary")
    public ApiResponse<EventArtifactsSummaryResponse> getArtifactsSummary(@PathVariable Long eventId) {
        return ApiResponse.ok(eventArtifactsService.getSummary(eventId));
    }
}
