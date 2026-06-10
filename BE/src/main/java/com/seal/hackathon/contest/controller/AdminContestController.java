package com.seal.hackathon.contest.controller;

import com.seal.hackathon.common.response.ApiResponse;
import com.seal.hackathon.common.response.PagedResult;
import com.seal.hackathon.contest.dto.BoardResponse;
import com.seal.hackathon.contest.dto.BoardSlotResponse;
import com.seal.hackathon.contest.dto.BoardTeamResponse;
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
import com.seal.hackathon.authprofile.security.CurrentUserProvider;
import com.seal.hackathon.common.idempotency.IdempotencyExecutor;
import com.seal.hackathon.contest.service.ContestManagementService;
import com.seal.hackathon.contest.service.ContestStructureDeletionService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.seal.hackathon.contest.dto.AssignRequest;
import com.seal.hackathon.contest.dto.AssignResponse;
import com.seal.hackathon.contest.dto.MoveRequest;
import com.seal.hackathon.contest.dto.MoveResponse;
import com.seal.hackathon.contest.dto.SwapRequest;
import com.seal.hackathon.contest.dto.SwapResponse;
import com.seal.hackathon.contest.dto.RandomAssignRequest;
import com.seal.hackathon.contest.dto.RandomAssignResponse;

@RestController
@RequestMapping("/api/v1/admin")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
public class AdminContestController {

    private final ContestManagementService contestManagementService;
    private final ContestStructureDeletionService contestStructureDeletionService;
    private final IdempotencyExecutor idempotencyExecutor;
    private final CurrentUserProvider currentUserProvider;

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

    @GetMapping("/events/{eventId}")
    public ApiResponse<EventResponse> getEvent(@PathVariable Long eventId) {
        return ApiResponse.ok(contestManagementService.getAdminEvent(eventId));
    }

    @PostMapping("/events/{eventId}/open-registration")
    public ApiResponse<EventResponse> openEventRegistration(@PathVariable Long eventId) {
        return ApiResponse.ok(contestManagementService.openEventRegistration(eventId));
    }

    @GetMapping("/events/{eventId}/rounds")
    public ApiResponse<List<RoundResponse>> getRoundsByEvent(@PathVariable Long eventId) {
        return ApiResponse.ok(contestManagementService.listAdminRoundsByEvent(eventId));
    }

    @PostMapping("/events/{eventId}/rounds")
    public ApiResponse<RoundResponse> createRound(
            @PathVariable Long eventId,
            @Valid @RequestBody CreateRoundRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        Long userId = currentUserProvider.getCurrentUser().getUserId();
        String path = "/api/v1/admin/events/" + eventId + "/rounds";
        return ApiResponse.ok(idempotencyExecutor.execute(
                userId, idempotencyKey, "POST", path, request, RoundResponse.class,
                () -> contestManagementService.createRound(eventId, request)));
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

    @DeleteMapping("/rounds/{roundId}")
    public ApiResponse<Void> deleteRound(@PathVariable Long roundId) {
        contestStructureDeletionService.deleteRound(roundId);
        return ApiResponse.ok(null);
    }

    @GetMapping("/rounds/{roundId}/boards")
    public ApiResponse<?> getBoardsByRound(
            @PathVariable Long roundId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        if (page != null || size != null) {
            int resolvedPage = page != null ? page : 0;
            int resolvedSize = size != null ? size : 50;
            return ApiResponse.ok(contestManagementService.listBoardsByRoundPaged(roundId, resolvedPage, resolvedSize));
        }
        return ApiResponse.ok(contestManagementService.listBoardsByRound(roundId));
    }

    @PostMapping("/rounds/{roundId}/boards")
    public ApiResponse<BoardResponse> createBoard(
            @PathVariable Long roundId,
            @Valid @RequestBody CreateBoardRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        Long userId = currentUserProvider.getCurrentUser().getUserId();
        String path = "/api/v1/admin/rounds/" + roundId + "/boards";
        return ApiResponse.ok(idempotencyExecutor.execute(
                userId, idempotencyKey, "POST", path, request, BoardResponse.class,
                () -> contestManagementService.createBoard(roundId, request)));
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

    @PostMapping("/rounds/{roundId}/boards/slots/{slotId}/assign")
    public ApiResponse<AssignResponse> assignTeamToSlot(
            @PathVariable Long roundId,
            @PathVariable Long slotId,
            @Valid @RequestBody AssignRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        Long userId = currentUserProvider.getCurrentUser().getUserId();
        String path = "/api/v1/admin/rounds/" + roundId + "/boards/slots/" + slotId + "/assign";
        return ApiResponse.ok(idempotencyExecutor.execute(
                userId,
                idempotencyKey,
                "POST",
                path,
                request,
                AssignResponse.class,
                () -> contestManagementService.assignTeamToSlot(roundId, slotId, request)));
    }

    @PostMapping("/rounds/{roundId}/boards/slots/{slotId}/unassign")
    public ApiResponse<AssignResponse> unassignTeamFromSlot(
            @PathVariable Long roundId,
            @PathVariable Long slotId) {
        return ApiResponse.ok(contestManagementService.unassignTeamFromSlot(roundId, slotId));
    }

    @GetMapping("/boards/{boardId}/teams")
    public ApiResponse<List<BoardTeamResponse>> getTeamsByBoard(@PathVariable Long boardId) {
        return ApiResponse.ok(contestManagementService.listTeamsByBoard(boardId));
    }

    @PostMapping("/rounds/{roundId}/boards/slots/move")
    public ApiResponse<MoveResponse> moveTeamBetweenSlots(
            @PathVariable Long roundId,
            @Valid @RequestBody MoveRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        Long userId = currentUserProvider.getCurrentUser().getUserId();
        String path = "/api/v1/admin/rounds/" + roundId + "/boards/slots/move";
        return ApiResponse.ok(idempotencyExecutor.execute(
                userId, idempotencyKey, "POST", path, request, MoveResponse.class,
                () -> contestManagementService.moveTeamBetweenSlots(
                        roundId, request.getFromSlotId(), request.getToSlotId())));
    }

    @PostMapping("/rounds/{roundId}/boards/slots/swap")
    public ApiResponse<SwapResponse> swapSlots(
            @PathVariable Long roundId,
            @Valid @RequestBody SwapRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        Long userId = currentUserProvider.getCurrentUser().getUserId();
        String path = "/api/v1/admin/rounds/" + roundId + "/boards/slots/swap";
        return ApiResponse.ok(idempotencyExecutor.execute(
                userId, idempotencyKey, "POST", path, request, SwapResponse.class,
                () -> contestManagementService.swapSlots(roundId, request.getSlotAId(), request.getSlotBId())));
    }

    @PostMapping("/rounds/{roundId}/boards/assign/random")
    public ApiResponse<RandomAssignResponse> randomAssign(
            @PathVariable Long roundId,
            @Valid @RequestBody RandomAssignRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        Long userId = currentUserProvider.getCurrentUser().getUserId();
        String path = "/api/v1/admin/rounds/" + roundId + "/boards/assign/random";
        return ApiResponse.ok(idempotencyExecutor.execute(
                userId, idempotencyKey, "POST", path, request, RandomAssignResponse.class,
                () -> contestManagementService.randomAssign(roundId, request)));
    }

    @GetMapping("/boards/{boardId}/problems")
    public ApiResponse<List<ProblemResponse>> getProblemsByBoard(@PathVariable Long boardId) {
        return ApiResponse.ok(contestManagementService.listProblemsByBoard(boardId));
    }

    @PostMapping("/boards/{boardId}/problems")
    public ApiResponse<ProblemResponse> createProblem(
            @PathVariable Long boardId,
            @Valid @RequestBody CreateProblemRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        Long userId = currentUserProvider.getCurrentUser().getUserId();
        String path = "/api/v1/admin/boards/" + boardId + "/problems";
        return ApiResponse.ok(idempotencyExecutor.execute(
                userId, idempotencyKey, "POST", path, request, ProblemResponse.class,
                () -> contestManagementService.createProblem(boardId, request)));
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

    @DeleteMapping("/problems/{problemId}")
    public ApiResponse<Void> deleteProblem(@PathVariable Long problemId) {
        contestManagementService.deleteProblem(problemId);
        return ApiResponse.ok(null);
    }

    @DeleteMapping("/board-slots/{slotId}")
    public ApiResponse<Void> deleteBoardSlot(@PathVariable Long slotId) {
        contestManagementService.deleteBoardSlot(slotId);
        return ApiResponse.ok(null);
    }

    @DeleteMapping("/boards/{boardId}")
    public ApiResponse<Void> deleteBoard(@PathVariable Long boardId) {
        contestStructureDeletionService.deleteBoard(boardId);
        return ApiResponse.ok(null);
    }
}
