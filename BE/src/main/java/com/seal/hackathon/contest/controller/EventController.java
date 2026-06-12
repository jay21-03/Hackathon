package com.seal.hackathon.contest.controller;

import com.seal.hackathon.common.response.ApiResponse;
import com.seal.hackathon.contest.dto.EventDetailResponse;
import com.seal.hackathon.contest.dto.EventListItemResponse;
import com.seal.hackathon.contest.dto.RoundResponse;
import com.seal.hackathon.contest.service.ContestManagementService;
import com.seal.hackathon.award.dto.EventAwardsResponse;
import com.seal.hackathon.award.service.AwardService;
import com.seal.hackathon.ranking.dto.PublicEventResultsResponse;
import com.seal.hackathon.ranking.service.RankingService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class EventController {

    private final ContestManagementService contestManagementService;
    private final RankingService rankingService;
    private final AwardService awardService;

    @GetMapping
    public ApiResponse<List<EventListItemResponse>> getEvents(
            @RequestParam(required = false) Long academicTermId) {
        return ApiResponse.ok(contestManagementService.listPublicEvents(academicTermId));
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

    /** Kết quả đã công bố — public, chỉ trả dữ liệu sau publish. */
    @GetMapping("/{eventId}/results")
    public ApiResponse<PublicEventResultsResponse> getPublishedResults(@PathVariable Long eventId) {
        return ApiResponse.ok(rankingService.getPublicEventResults(eventId));
    }

    /** Giải thưởng đã công bố — public, chỉ trả dữ liệu sau publish. */
    @GetMapping("/{eventId}/awards")
    public ApiResponse<EventAwardsResponse> getPublishedAwards(@PathVariable Long eventId) {
        return ApiResponse.ok(awardService.getPublicAwards(eventId));
    }
}
