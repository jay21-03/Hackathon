package com.seal.hackathon.aireview.controller;



import com.seal.hackathon.aireview.dto.AiReviewBulkJobResponse;

import com.seal.hackathon.aireview.dto.AiReviewResponse;

import com.seal.hackathon.aireview.dto.BulkAiReviewResponse;

import com.seal.hackathon.aireview.service.AiReviewBulkJobService;

import com.seal.hackathon.aireview.service.AiReviewService;

import com.seal.hackathon.common.response.ApiResponse;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;

import java.util.List;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.GetMapping;

import org.springframework.web.bind.annotation.PathVariable;

import org.springframework.web.bind.annotation.PostMapping;

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
