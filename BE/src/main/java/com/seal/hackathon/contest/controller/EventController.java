package com.seal.hackathon.contest.controller;

import com.seal.hackathon.common.response.ApiResponse;
import com.seal.hackathon.contest.dto.EventDetailResponse;
import com.seal.hackathon.contest.dto.EventListItemResponse;
import com.seal.hackathon.contest.dto.RoundResponse;
import com.seal.hackathon.contest.service.ContestManagementService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class EventController {

    private final ContestManagementService contestManagementService;

    @GetMapping
    public ApiResponse<List<EventListItemResponse>> getEvents() {
        return ApiResponse.ok(contestManagementService.listPublicEvents());
    }

    @GetMapping("/{eventId}")
    public ApiResponse<EventDetailResponse> getEventDetail(@PathVariable Long eventId) {
        return ApiResponse.ok(contestManagementService.getPublicEventDetail(eventId));
    }

    /** Danh sách vòng thi (read-only) — dùng cho countdown thí sinh, không cần role ORGANIZER. */
    @GetMapping("/{eventId}/rounds")
    public ApiResponse<List<RoundResponse>> listEventRounds(@PathVariable Long eventId) {
        return ApiResponse.ok(contestManagementService.listRoundsByEvent(eventId));
    }
}
