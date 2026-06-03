package com.seal.hackathon.assignment.controller;

import com.seal.hackathon.assignment.dto.AssignmentResponse;
import com.seal.hackathon.assignment.dto.CreateAssignmentRequest;
import com.seal.hackathon.assignment.service.BoardAssignmentService;
import com.seal.hackathon.common.response.ApiResponse;
import java.util.List;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class AssignmentController {

    private final BoardAssignmentService boardAssignmentService;

    @PostMapping("/boards/{boardId}/mentors")
    public ApiResponse<AssignmentResponse> assignMentor(@PathVariable Long boardId, @RequestBody CreateAssignmentRequest request) {
        return ApiResponse.ok(boardAssignmentService.assignMentor(boardId, request));
    }

    @DeleteMapping("/boards/{boardId}/mentors/{mentorId}")
    public ApiResponse<String> deleteMentor(@PathVariable Long boardId, @PathVariable Long mentorId) {
        boardAssignmentService.deleteMentorAssignment(boardId, mentorId);
        return ApiResponse.ok("deleted");
    }

    @PostMapping("/boards/{boardId}/judges")
    public ApiResponse<AssignmentResponse> assignJudge(@PathVariable Long boardId, @RequestBody CreateAssignmentRequest request) {
        return ApiResponse.ok(boardAssignmentService.assignJudge(boardId, request));
    }

    @DeleteMapping("/boards/{boardId}/judges/{judgeId}")
    public ApiResponse<String> deleteJudge(@PathVariable Long boardId, @PathVariable Long judgeId) {
        boardAssignmentService.deleteJudgeAssignment(boardId, judgeId);
        return ApiResponse.ok("deleted");
    }

    @GetMapping("/mentors/assignments")
    public ApiResponse<List<AssignmentResponse>> myMentorAssignments() {
        return ApiResponse.ok(boardAssignmentService.listMentorAssignmentsForCurrentUser());
    }

    @GetMapping("/judges/assignments")
    public ApiResponse<List<AssignmentResponse>> myJudgeAssignments() {
        return ApiResponse.ok(boardAssignmentService.listJudgeAssignmentsForCurrentUser());
    }
}

