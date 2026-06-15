package com.seal.hackathon.aireview.controller;

import com.seal.hackathon.aireview.dto.AiReviewResponse;
import com.seal.hackathon.aireview.service.AiReviewService;
import com.seal.hackathon.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class AiReviewController {

    private final AiReviewService aiReviewService;

    @GetMapping("/teams/{teamId}/ai-reviews")
    public ApiResponse<List<AiReviewResponse>> listTeamReviews(@PathVariable Long teamId) {
        return ApiResponse.ok(aiReviewService.listTeamReviews(teamId));
    }

    @GetMapping("/teams/{teamId}/ai-review")
    public ApiResponse<AiReviewResponse> latestTeamReview(@PathVariable Long teamId) {
        return ApiResponse.ok(aiReviewService.getLatestTeamReview(teamId));
    }
}
