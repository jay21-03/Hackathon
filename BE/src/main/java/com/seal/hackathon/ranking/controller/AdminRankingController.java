package com.seal.hackathon.ranking.controller;

import com.seal.hackathon.common.response.ApiResponse;
import com.seal.hackathon.ranking.dto.BoardRankingResponse;
import com.seal.hackathon.ranking.dto.CalculateRankingResponse;
import com.seal.hackathon.ranking.dto.EventRankingsResponse;
import com.seal.hackathon.ranking.service.RankingService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class AdminRankingController {

    private final RankingService rankingService;

    @GetMapping("/boards/{boardId}/rankings")
    public ApiResponse<BoardRankingResponse> getBoardRanking(@PathVariable Long boardId) {
        return ApiResponse.ok(rankingService.getBoardRanking(boardId));
    }

    @PostMapping("/boards/{boardId}/rankings/calculate")
    public ApiResponse<BoardRankingResponse> calculateBoardRanking(
            @PathVariable Long boardId, @RequestParam(defaultValue = "false") boolean force) {
        return ApiResponse.ok(rankingService.calculateBoardRanking(boardId, force));
    }

    @PostMapping("/boards/{boardId}/rankings/publish")
    public ApiResponse<BoardRankingResponse> publishBoardRanking(@PathVariable Long boardId) {
        return ApiResponse.ok(rankingService.publishBoardRanking(boardId));
    }

    @PostMapping("/rounds/{roundId}/rankings/calculate")
    public ApiResponse<CalculateRankingResponse> calculateRoundRanking(
            @PathVariable Long roundId, @RequestParam(defaultValue = "false") boolean force) {
        return ApiResponse.ok(rankingService.calculateRoundRanking(roundId, force));
    }

    @GetMapping("/events/{eventId}/rankings")
    public ApiResponse<EventRankingsResponse> getEventRankings(@PathVariable Long eventId) {
        return ApiResponse.ok(rankingService.getEventRankings(eventId));
    }

    @PostMapping("/events/{eventId}/rankings/publish")
    public ApiResponse<CalculateRankingResponse> publishEventRankings(@PathVariable Long eventId) {
        return ApiResponse.ok(rankingService.publishEventRankings(eventId));
    }
}
