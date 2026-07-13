package com.seal.hackathon.contest.controller;

import com.seal.hackathon.authprofile.security.CurrentUserProvider;
import com.seal.hackathon.common.response.ApiResponse;
import com.seal.hackathon.contest.dto.MyBoardResponse;
import com.seal.hackathon.contest.dto.MyProblemResponse;
import com.seal.hackathon.contest.service.ContestManagementService;
import com.seal.hackathon.scoring.dto.RubricResponse;
import com.seal.hackathon.scoring.service.ScoringService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/my")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class ParticipantContestController {

    private final ContestManagementService contestManagementService;
    private final ScoringService scoringService;
    private final CurrentUserProvider currentUserProvider;

    @GetMapping("/board")
    public ApiResponse<MyBoardResponse> getMyBoard(@RequestParam Long eventId) {
        Long userId = currentUserProvider.getCurrentUser().getUserId();
        return ApiResponse.ok(contestManagementService.getMyBoard(eventId, userId));
    }

    @GetMapping("/problem")
    public ApiResponse<MyProblemResponse> getMyProblem(@RequestParam Long eventId) {
        Long userId = currentUserProvider.getCurrentUser().getUserId();
        return ApiResponse.ok(contestManagementService.getMyProblem(eventId, userId));
    }

    @GetMapping("/problem-rubric")
    public ApiResponse<RubricResponse> getMyProblemRubric(@RequestParam Long eventId) {
        Long userId = currentUserProvider.getCurrentUser().getUserId();
        MyBoardResponse board = contestManagementService.getMyBoard(eventId, userId);
        if (!board.isAssigned() || board.getRoundId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "NOT_ASSIGNED");
        }
        return ApiResponse.ok(scoringService.getRubric(board.getRoundId()));
    }
}
