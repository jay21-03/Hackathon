package com.seal.hackathon.aireview.controller;

import com.seal.hackathon.aireview.service.AiReviewService;
import com.seal.hackathon.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai-reviews")
@RequiredArgsConstructor
public class AiReviewController {

    private final AiReviewService aiReviewService;

    @GetMapping("/health")
    public ApiResponse<String> health() {
        return ApiResponse.ok(aiReviewService.skeletonStatus());
    }
}
