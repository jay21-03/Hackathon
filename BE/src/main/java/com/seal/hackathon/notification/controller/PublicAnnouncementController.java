package com.seal.hackathon.notification.controller;

import com.seal.hackathon.common.response.ApiResponse;
import com.seal.hackathon.notification.dto.AnnouncementResponse;
import com.seal.hackathon.notification.service.AnnouncementService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/events/{eventId}/announcements")
@RequiredArgsConstructor
public class PublicAnnouncementController {

    private final AnnouncementService announcementService;

    @GetMapping
    public ApiResponse<List<AnnouncementResponse>> listPublishedAnnouncements(@PathVariable Long eventId) {
        return ApiResponse.ok(announcementService.listPublishedForEvent(eventId));
    }
}
