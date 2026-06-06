package com.seal.hackathon.scoring.controller;

import com.seal.hackathon.common.response.ApiResponse;
import com.seal.hackathon.scoring.dto.SaveMatrixRequest;
import com.seal.hackathon.scoring.dto.SaveMatrixResponse;
import com.seal.hackathon.scoring.dto.ScoreMatrixResponse;
import com.seal.hackathon.scoring.dto.SubmitMatrixRequest;
import com.seal.hackathon.scoring.dto.SubmitMatrixResponse;
import com.seal.hackathon.scoring.service.ScoringService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/judge")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class JudgeScoringController {

    private final ScoringService scoringService;

    @GetMapping("/boards/{boardId}/score-matrix")
    public ApiResponse<ScoreMatrixResponse> getScoreMatrix(@PathVariable Long boardId) {
        return ApiResponse.ok(scoringService.getScoreMatrix(boardId));
    }

    @PutMapping("/boards/{boardId}/score-matrix")
    public ApiResponse<SaveMatrixResponse> saveScoreMatrix(
            @PathVariable Long boardId,
            @Valid @RequestBody SaveMatrixRequest request) {
        return ApiResponse.ok(scoringService.saveScoreMatrix(boardId, request));
    }

    @PostMapping("/boards/{boardId}/score-matrix/submit")
    public ApiResponse<SubmitMatrixResponse> submitScoreMatrix(
            @PathVariable Long boardId,
            @RequestBody SubmitMatrixRequest request) {
        return ApiResponse.ok(scoringService.submitScoreMatrix(boardId, request != null ? request : new SubmitMatrixRequest()));
    }
}
