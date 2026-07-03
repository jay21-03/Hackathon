package com.seal.hackathon.aireview.controller;



import com.seal.hackathon.aireview.dto.AiReviewBulkJobResponse;

import com.seal.hackathon.aireview.dto.AiReviewHealthResponse;
import com.seal.hackathon.aireview.dto.AiReviewResponse;

import com.seal.hackathon.aireview.dto.BackfillCommitsRequest;
import com.seal.hackathon.aireview.dto.BackfillCommitsResponse;
import com.seal.hackathon.aireview.dto.BulkAiReviewResponse;
import com.seal.hackathon.aireview.dto.RetryFailedReviewsResponse;

import com.seal.hackathon.aireview.service.AiReviewBulkJobService;

import com.seal.hackathon.aireview.service.AiReviewService;

import com.seal.hackathon.common.response.ApiResponse;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;

import java.nio.charset.StandardCharsets;
import java.util.List;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.GetMapping;

import org.springframework.web.bind.annotation.PathVariable;

import org.springframework.web.bind.annotation.PostMapping;

import org.springframework.web.bind.annotation.RequestBody;

import org.springframework.web.bind.annotation.RequestMapping;

import org.springframework.web.bind.annotation.RestController;



@RestController

@RequestMapping("/api/v1/admin")

@RequiredArgsConstructor

@SecurityRequirement(name = "bearerAuth")

public class AdminAiReviewController {



    private final AiReviewService aiReviewService;

    private final AiReviewBulkJobService bulkJobService;



    @GetMapping("/events/{eventId}/ai-reviews")

    public ApiResponse<List<AiReviewResponse>> listEventReviews(@PathVariable Long eventId) {

        return ApiResponse.ok(aiReviewService.listEventReviews(eventId));

    }



    @PostMapping("/teams/{teamId}/ai-reviews/run")

    public ApiResponse<AiReviewResponse> triggerTeamReview(@PathVariable Long teamId) {

        return ApiResponse.ok(aiReviewService.triggerTeamReview(teamId));

    }

    @PostMapping("/events/{eventId}/teams/{teamId}/ai-reviews/run")
    public ApiResponse<AiReviewResponse> triggerTeamReview(
            @PathVariable Long eventId, @PathVariable Long teamId) {
        return ApiResponse.ok(aiReviewService.triggerTeamReview(eventId, teamId));
    }

    @GetMapping("/events/{eventId}/ai-reviews/health")
    public ApiResponse<AiReviewHealthResponse> getHealth(@PathVariable Long eventId) {
        return ApiResponse.ok(aiReviewService.getEventHealth(eventId));
    }

    @GetMapping(value = "/events/{eventId}/ai-reviews/export", produces = "text/csv")
    public ResponseEntity<byte[]> exportReviews(@PathVariable Long eventId) {
        String csv = aiReviewService.exportEventReviewsCsv(eventId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"ai-reviews-event-" + eventId + ".csv\"")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(csv.getBytes(StandardCharsets.UTF_8));
    }

    @PostMapping("/events/{eventId}/ai-reviews/retry-failed")
    public ApiResponse<RetryFailedReviewsResponse> retryFailed(@PathVariable Long eventId) {
        return ApiResponse.ok(aiReviewService.retryFailedReviewsForEvent(eventId));
    }

    @PostMapping("/teams/{teamId}/ai-reviews/backfill")
    public ApiResponse<BackfillCommitsResponse> backfillCommits(
            @PathVariable Long teamId, @RequestBody BackfillCommitsRequest request) {
        return ApiResponse.ok(aiReviewService.backfillCommits(teamId, request));
    }

    @PostMapping("/events/{eventId}/teams/{teamId}/ai-reviews/backfill")
    public ApiResponse<BackfillCommitsResponse> backfillCommits(
            @PathVariable Long eventId, @PathVariable Long teamId, @RequestBody BackfillCommitsRequest request) {
        return ApiResponse.ok(aiReviewService.backfillCommits(eventId, teamId, request));
    }



    @PostMapping("/events/{eventId}/ai-reviews/run-all")

    public ApiResponse<BulkAiReviewResponse> triggerEventReviews(@PathVariable Long eventId) {

        return ApiResponse.ok(aiReviewService.triggerEventReviews(eventId));

    }



    @PostMapping("/events/{eventId}/ai-reviews/run-all-async")

    public ApiResponse<AiReviewBulkJobResponse> triggerEventReviewsAsync(@PathVariable Long eventId) {

        return ApiResponse.ok(bulkJobService.startEventReviewJob(eventId));

    }



    @GetMapping("/events/{eventId}/ai-reviews/jobs/{jobId}")

    public ApiResponse<AiReviewBulkJobResponse> getBulkJob(

            @PathVariable Long eventId, @PathVariable String jobId) {

        return ApiResponse.ok(bulkJobService.getJob(eventId, jobId));

    }

}
