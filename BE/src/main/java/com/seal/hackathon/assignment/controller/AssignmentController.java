package com.seal.hackathon.assignment.controller;

import com.seal.hackathon.assignment.dto.AssignmentResponse;
import com.seal.hackathon.assignment.dto.CreateAssignmentRequest;
import com.seal.hackathon.assignment.service.BoardAssignmentService;
import com.seal.hackathon.contest.dto.BoardTeamResponse;
import com.seal.hackathon.common.response.ApiResponse;
import java.util.List;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
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

    @GetMapping("/boards/{boardId}/mentors")
    public ApiResponse<List<AssignmentResponse>> listBoardMentors(@PathVariable Long boardId) {
        return ApiResponse.ok(boardAssignmentService.listMentorsByBoard(boardId));
    }

    @PostMapping("/boards/{boardId}/mentors")
    public ApiResponse<AssignmentResponse> assignMentor(
            @PathVariable Long boardId, @Valid @RequestBody CreateAssignmentRequest request) {
        return ApiResponse.ok(boardAssignmentService.assignMentor(boardId, request));
    }

    @DeleteMapping("/boards/{boardId}/mentors/{mentorId}")
    public ApiResponse<String> deleteMentor(@PathVariable Long boardId, @PathVariable Long mentorId) {
        boardAssignmentService.deleteMentorAssignment(boardId, mentorId);
        return ApiResponse.ok("deleted");
    }

    @GetMapping("/boards/{boardId}/judges")
    public ApiResponse<List<AssignmentResponse>> listBoardJudges(@PathVariable Long boardId) {
        return ApiResponse.ok(boardAssignmentService.listJudgesByBoard(boardId));
    }

    @PostMapping("/boards/{boardId}/judges")
    public ApiResponse<AssignmentResponse> assignJudge(
            @PathVariable Long boardId, @Valid @RequestBody CreateAssignmentRequest request) {
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

    @GetMapping("/mentors/boards/{boardId}/teams")
    public ApiResponse<List<BoardTeamResponse>> mentorBoardTeams(@PathVariable Long boardId) {
        return ApiResponse.ok(boardAssignmentService.listTeamsForMentor(boardId));
    }

    @GetMapping("/judges/assignments")
    public ApiResponse<List<AssignmentResponse>> myJudgeAssignments() {
        return ApiResponse.ok(boardAssignmentService.listJudgeAssignmentsForCurrentUser());
    }

    @GetMapping("/judges/boards/{boardId}/teams")
    public ApiResponse<List<BoardTeamResponse>> judgeBoardTeams(@PathVariable Long boardId) {
        return ApiResponse.ok(boardAssignmentService.listTeamsForJudge(boardId));
    }
}

