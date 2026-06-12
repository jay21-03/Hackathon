package com.seal.hackathon.scoring.controller;



import com.seal.hackathon.authprofile.security.CurrentUserProvider;

import com.seal.hackathon.common.idempotency.IdempotencyExecutor;

import com.seal.hackathon.common.response.ApiResponse;

import com.seal.hackathon.scoring.dto.ApplyRubricActionRequest;
import com.seal.hackathon.scoring.dto.RubricResponse;
import com.seal.hackathon.scoring.dto.SaveRubricRequest;
import com.seal.hackathon.scoring.service.CriteriaTemplateService;

import com.seal.hackathon.scoring.dto.ScoreProgressResponse;

import com.seal.hackathon.scoring.service.ScoringService;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.GetMapping;

import org.springframework.web.bind.annotation.PathVariable;

import org.springframework.web.bind.annotation.PostMapping;

import org.springframework.web.bind.annotation.RequestBody;

import org.springframework.web.bind.annotation.RequestHeader;

import org.springframework.web.bind.annotation.RequestMapping;

import org.springframework.web.bind.annotation.RestController;



@RestController

@RequestMapping("/api/v1/admin")

@RequiredArgsConstructor

@SecurityRequirement(name = "bearerAuth")

public class AdminScoringController {



    private final ScoringService scoringService;

    private final CriteriaTemplateService criteriaTemplateService;

    private final IdempotencyExecutor idempotencyExecutor;

    private final CurrentUserProvider currentUserProvider;



    @GetMapping("/rounds/{roundId}/criteria")

    public ApiResponse<RubricResponse> getRubric(@PathVariable Long roundId) {

        return ApiResponse.ok(scoringService.getRubric(roundId));

    }



    @PostMapping("/rounds/{roundId}/criteria/apply-template/{templateId}")
    public ApiResponse<RubricResponse> applyCriteriaTemplate(
            @PathVariable Long roundId,
            @PathVariable Long templateId,
            @RequestBody(required = false) ApplyRubricActionRequest request) {
        boolean replaceExisting = request == null || request.isReplaceExisting();
        return ApiResponse.ok(criteriaTemplateService.applyTemplateToRound(roundId, templateId, replaceExisting));
    }

    @PostMapping("/rounds/{targetRoundId}/criteria/copy-from-round/{sourceRoundId}")
    public ApiResponse<RubricResponse> copyRubricFromRound(
            @PathVariable Long targetRoundId,
            @PathVariable Long sourceRoundId,
            @RequestBody(required = false) ApplyRubricActionRequest request) {
        boolean replaceExisting = request == null || request.isReplaceExisting();
        return ApiResponse.ok(scoringService.copyRubricFromRound(targetRoundId, sourceRoundId, replaceExisting));
    }

    @PostMapping("/rounds/{roundId}/criteria")

    public ApiResponse<RubricResponse> saveRubric(

            @PathVariable Long roundId,

            @Valid @RequestBody SaveRubricRequest request,

            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {

        Long userId = currentUserProvider.getCurrentUser().getUserId();

        String path = "/api/v1/admin/rounds/" + roundId + "/criteria";

        return ApiResponse.ok(idempotencyExecutor.execute(

                userId, idempotencyKey, "POST", path, request, RubricResponse.class,

                () -> scoringService.saveRubric(roundId, request)));

    }



    @GetMapping("/boards/{boardId}/score-progress")

    public ApiResponse<ScoreProgressResponse> getScoreProgress(@PathVariable Long boardId) {

        return ApiResponse.ok(scoringService.getScoreProgress(boardId));

    }



    @PostMapping("/boards/{boardId}/scoring-reminders")

    public ApiResponse<String> sendScoringReminder(@PathVariable Long boardId) {

        scoringService.sendScoringReminder(boardId);

        return ApiResponse.ok("sent");

    }

}


