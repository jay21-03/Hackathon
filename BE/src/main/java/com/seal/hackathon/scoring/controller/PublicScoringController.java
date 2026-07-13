package com.seal.hackathon.scoring.controller;

import com.seal.hackathon.common.response.ApiResponse;
import com.seal.hackathon.scoring.dto.RubricResponse;
import com.seal.hackathon.scoring.service.ScoringService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class PublicScoringController {

    private final ScoringService scoringService;

    @GetMapping("/rounds/{roundId}/criteria")
    public ApiResponse<RubricResponse> getPublicRubric(@PathVariable Long roundId) {
        return ApiResponse.ok(scoringService.getRubric(roundId));
    }
}
