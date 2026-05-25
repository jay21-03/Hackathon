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
import com.seal.hackathon.contest.dto.UpdateBoardRequest;
import com.seal.hackathon.contest.dto.UpdateBoardSlotRequest;
import com.seal.hackathon.contest.dto.UpdateEventRequest;
import com.seal.hackathon.contest.dto.UpdateProblemRequest;
import com.seal.hackathon.contest.dto.UpdateRoundRequest;
import com.seal.hackathon.contest.service.ContestManagementService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
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

    @GetMapping("/events/{eventId}/rounds")
    public ApiResponse<List<RoundResponse>> getRoundsByEvent(@PathVariable Long eventId) {
        return ApiResponse.ok(contestManagementService.listRoundsByEvent(eventId));
    }

    @PostMapping("/events/{eventId}/rounds")
    public ApiResponse<RoundResponse> createRound(
            @PathVariable Long eventId,
            @Valid @RequestBody CreateRoundRequest request) {
        return ApiResponse.ok(contestManagementService.createRound(eventId, request));
    }

    @GetMapping("/rounds/{roundId}")
    public ApiResponse<RoundResponse> getRound(@PathVariable Long roundId) {
        return ApiResponse.ok(contestManagementService.getRound(roundId));
    }

    @PutMapping("/rounds/{roundId}")
    public ApiResponse<RoundResponse> updateRound(
            @PathVariable Long roundId,
            @Valid @RequestBody UpdateRoundRequest request) {
        return ApiResponse.ok(contestManagementService.updateRound(roundId, request));
    }

    @GetMapping("/rounds/{roundId}/boards")
    public ApiResponse<List<BoardResponse>> getBoardsByRound(@PathVariable Long roundId) {
        return ApiResponse.ok(contestManagementService.listBoardsByRound(roundId));
    }

    @PostMapping("/rounds/{roundId}/boards")
    public ApiResponse<BoardResponse> createBoard(
            @PathVariable Long roundId,
            @Valid @RequestBody CreateBoardRequest request) {
        return ApiResponse.ok(contestManagementService.createBoard(roundId, request));
    }

    @GetMapping("/boards/{boardId}")
    public ApiResponse<BoardResponse> getBoard(@PathVariable Long boardId) {
        return ApiResponse.ok(contestManagementService.getBoard(boardId));
    }

    @PutMapping("/boards/{boardId}")
    public ApiResponse<BoardResponse> updateBoard(
            @PathVariable Long boardId,
            @Valid @RequestBody UpdateBoardRequest request) {
        return ApiResponse.ok(contestManagementService.updateBoard(boardId, request));
    }

    @GetMapping("/boards/{boardId}/slots")
    public ApiResponse<List<BoardSlotResponse>> getSlotsByBoard(@PathVariable Long boardId) {
        return ApiResponse.ok(contestManagementService.listBoardSlotsByBoard(boardId));
    }

    @PostMapping("/boards/{boardId}/slots")
    public ApiResponse<BoardSlotResponse> createBoardSlot(
            @PathVariable Long boardId,
            @Valid @RequestBody CreateBoardSlotRequest request) {
        return ApiResponse.ok(contestManagementService.createBoardSlot(boardId, request));
    }

    @GetMapping("/board-slots/{slotId}")
    public ApiResponse<BoardSlotResponse> getBoardSlot(@PathVariable Long slotId) {
        return ApiResponse.ok(contestManagementService.getBoardSlot(slotId));
    }

    @PutMapping("/board-slots/{slotId}")
    public ApiResponse<BoardSlotResponse> updateBoardSlot(
            @PathVariable Long slotId,
            @Valid @RequestBody UpdateBoardSlotRequest request) {
        return ApiResponse.ok(contestManagementService.updateBoardSlot(slotId, request));
    }

    @GetMapping("/boards/{boardId}/problems")
    public ApiResponse<List<ProblemResponse>> getProblemsByBoard(@PathVariable Long boardId) {
        return ApiResponse.ok(contestManagementService.listProblemsByBoard(boardId));
    }

    @PostMapping("/boards/{boardId}/problems")
    public ApiResponse<ProblemResponse> createProblem(
            @PathVariable Long boardId,
            @Valid @RequestBody CreateProblemRequest request) {
        return ApiResponse.ok(contestManagementService.createProblem(boardId, request));
    }

    @GetMapping("/problems/{problemId}")
    public ApiResponse<ProblemResponse> getProblem(@PathVariable Long problemId) {
        return ApiResponse.ok(contestManagementService.getProblem(problemId));
    }

    @PutMapping("/problems/{problemId}")
    public ApiResponse<ProblemResponse> updateProblem(
            @PathVariable Long problemId,
            @Valid @RequestBody UpdateProblemRequest request) {
        return ApiResponse.ok(contestManagementService.updateProblem(problemId, request));
    }
}
