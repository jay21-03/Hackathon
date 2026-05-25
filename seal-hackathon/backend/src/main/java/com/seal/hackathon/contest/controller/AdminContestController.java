package com.seal.hackathon.contest.controller;

import com.seal.hackathon.common.response.ApiResponse;
import com.seal.hackathon.contest.dto.BoardResponse;
import com.seal.hackathon.contest.dto.BoardSlotResponse;
import com.seal.hackathon.contest.dto.CreateBoardRequest;
import com.seal.hackathon.contest.dto.CreateBoardSlotRequest;
import com.seal.hackathon.contest.dto.CreateEventRequest;
import com.seal.hackathon.contest.dto.CreateProblemRequest;
import com.seal.hackathon.contest.dto.CreateRoundRequest;
import com.seal.hackathon.contest.dto.EventResponse;
import com.seal.hackathon.contest.dto.ProblemResponse;
import com.seal.hackathon.contest.dto.RoundResponse;
import com.seal.hackathon.contest.dto.UpdateEventRequest;
import com.seal.hackathon.contest.service.ContestManagementService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
public class AdminContestController {

    private final ContestManagementService contestManagementService;

    @PostMapping("/events")
    public ApiResponse<EventResponse> createEvent(@Valid @RequestBody CreateEventRequest request) {
        return ApiResponse.ok(contestManagementService.createEvent(request));
    }

    @PutMapping("/events/{eventId}")
    public ApiResponse<EventResponse> updateEvent(
            @PathVariable Long eventId,
            @Valid @RequestBody UpdateEventRequest request) {
        return ApiResponse.ok(contestManagementService.updateEvent(eventId, request));
    }

    @PostMapping("/events/{eventId}/rounds")
    public ApiResponse<RoundResponse> createRound(
            @PathVariable Long eventId,
            @Valid @RequestBody CreateRoundRequest request) {
        return ApiResponse.ok(contestManagementService.createRound(eventId, request));
    }

    @PostMapping("/rounds/{roundId}/boards")
    public ApiResponse<BoardResponse> createBoard(
            @PathVariable Long roundId,
            @Valid @RequestBody CreateBoardRequest request) {
        return ApiResponse.ok(contestManagementService.createBoard(roundId, request));
    }

    @PostMapping("/boards/{boardId}/slots")
    public ApiResponse<BoardSlotResponse> createBoardSlot(
            @PathVariable Long boardId,
            @Valid @RequestBody CreateBoardSlotRequest request) {
        return ApiResponse.ok(contestManagementService.createBoardSlot(boardId, request));
    }

    @PostMapping("/boards/{boardId}/problems")
    public ApiResponse<ProblemResponse> createProblem(
            @PathVariable Long boardId,
            @Valid @RequestBody CreateProblemRequest request) {
        return ApiResponse.ok(contestManagementService.createProblem(boardId, request));
    }
}
