package com.seal.hackathon.notification.controller;

import com.seal.hackathon.common.response.ApiResponse;
import com.seal.hackathon.notification.dto.AnnouncementResponse;
import com.seal.hackathon.notification.dto.CreateAnnouncementRequest;
import com.seal.hackathon.notification.service.AnnouncementService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/events/{eventId}/announcements")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class AdminAnnouncementController {

    private final AnnouncementService announcementService;

    @GetMapping
    public ApiResponse<List<AnnouncementResponse>> listAnnouncements(@PathVariable Long eventId) {
        return ApiResponse.ok(announcementService.listForOrganizer(eventId));
    }

    @PostMapping
    public ApiResponse<AnnouncementResponse> createAnnouncement(
            @PathVariable Long eventId,
            @Valid @RequestBody CreateAnnouncementRequest request) {
        return ApiResponse.ok(announcementService.create(eventId, request));
    }
}
