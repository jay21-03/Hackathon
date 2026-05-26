package com.seal.hackathon.ranking.controller;

import com.seal.hackathon.common.response.ApiResponse;
import com.seal.hackathon.ranking.service.AdvancementService;
import com.seal.hackathon.ranking.service.RankingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ranking")
@RequiredArgsConstructor
public class RankingController {

    private final RankingService rankingService;
    private final AdvancementService advancementService;

    @GetMapping("/health")
    public ApiResponse<String> health() {
        return ApiResponse.ok(rankingService.skeletonStatus() + " | " + advancementService.skeletonStatus());
    }
}
