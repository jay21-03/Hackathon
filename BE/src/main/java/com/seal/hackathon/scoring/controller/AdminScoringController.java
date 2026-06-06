package com.seal.hackathon.scoring.controller;

import com.seal.hackathon.common.response.ApiResponse;
import com.seal.hackathon.scoring.dto.RubricResponse;
import com.seal.hackathon.scoring.dto.SaveRubricRequest;
import com.seal.hackathon.scoring.dto.ScoreProgressResponse;
import com.seal.hackathon.scoring.service.ScoringService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
public class AdminScoringController {

    private final ScoringService scoringService;

    @GetMapping("/rounds/{roundId}/criteria")
    public ApiResponse<RubricResponse> getRubric(@PathVariable Long roundId) {
        return ApiResponse.ok(scoringService.getRubric(roundId));
    }

    @PostMapping("/rounds/{roundId}/criteria")
    public ApiResponse<RubricResponse> saveRubric(
            @PathVariable Long roundId,
            @Valid @RequestBody SaveRubricRequest request) {
        return ApiResponse.ok(scoringService.saveRubric(roundId, request));
    }

    @GetMapping("/boards/{boardId}/score-progress")
    public ApiResponse<ScoreProgressResponse> getScoreProgress(@PathVariable Long boardId) {
        return ApiResponse.ok(scoringService.getScoreProgress(boardId));
    }
}
