package com.seal.hackathon.submission.controller;

import com.seal.hackathon.common.response.ApiResponse;
import com.seal.hackathon.submission.dto.AdminTeamSubmissionResponse;
import com.seal.hackathon.submission.dto.SubmissionResponse;
import com.seal.hackathon.submission.service.SubmissionService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class AdminSubmissionController {

    private final SubmissionService submissionService;

    @GetMapping("/events/{eventId}/submissions")
    public ApiResponse<List<AdminTeamSubmissionResponse>> listEventSubmissions(
            @PathVariable Long eventId,
            @RequestParam(required = false) Long boardId) {
        return ApiResponse.ok(submissionService.listSubmissionsForOrganizer(eventId, boardId));
    }

    @GetMapping("/teams/{teamId}/submission")
    public ApiResponse<SubmissionResponse> getTeamSubmission(@PathVariable Long teamId) {
        return ApiResponse.ok(submissionService.getSubmissionForOrganizer(teamId));
    }
}
