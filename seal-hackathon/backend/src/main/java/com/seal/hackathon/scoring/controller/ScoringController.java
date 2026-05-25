package com.seal.hackathon.scoring.controller;

import com.seal.hackathon.common.response.ApiResponse;
import com.seal.hackathon.scoring.service.ScoringService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/scoring")
@RequiredArgsConstructor
public class ScoringController {

    private final ScoringService scoringService;

    @GetMapping("/health")
    public ApiResponse<String> health() {
        return ApiResponse.ok(scoringService.skeletonStatus());
    }
}
