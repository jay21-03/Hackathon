package com.seal.hackathon.submission.controller;

import com.seal.hackathon.authprofile.security.CurrentUserProvider;
import com.seal.hackathon.common.response.ApiResponse;
import com.seal.hackathon.submission.dto.SaveSubmissionDraftRequest;
import com.seal.hackathon.submission.dto.SubmissionResponse;
import com.seal.hackathon.submission.dto.SubmitSubmissionRequest;
import com.seal.hackathon.submission.service.SubmissionService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/my/submission")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class ParticipantSubmissionController {

    private final SubmissionService submissionService;
    private final CurrentUserProvider currentUserProvider;

    @GetMapping
    public ApiResponse<SubmissionResponse> getMySubmission(@RequestParam Long eventId) {
        Long userId = currentUserProvider.getCurrentUser().getUserId();
        return ApiResponse.ok(submissionService.getSubmission(eventId, userId));
    }

    @PutMapping("/draft")
    public ApiResponse<SubmissionResponse> saveSubmissionDraft(
            @Valid @RequestBody SaveSubmissionDraftRequest request) {
        Long userId = currentUserProvider.getCurrentUser().getUserId();
        return ApiResponse.ok(submissionService.saveDraft(userId, request));
    }

    @PostMapping("/submit")
    public ApiResponse<SubmissionResponse> submitSubmission(
            @Valid @RequestBody SubmitSubmissionRequest request) {
        Long userId = currentUserProvider.getCurrentUser().getUserId();
        return ApiResponse.ok(submissionService.submit(userId, request));
    }
}
