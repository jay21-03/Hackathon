package com.seal.hackathon.contest.controller;

import com.seal.hackathon.common.response.ApiResponse;
import com.seal.hackathon.contest.dto.RoundCountdownResponse;
import com.seal.hackathon.contest.dto.RoundResponse;
import com.seal.hackathon.contest.service.ContestManagementService;
import java.time.Duration;
import java.time.OffsetDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/rounds")
@RequiredArgsConstructor
public class RoundController {

    private final ContestManagementService contestManagementService;

    @GetMapping("/{roundId}/countdown")
    public ApiResponse<RoundCountdownResponse> getCountdown(@PathVariable Long roundId) {
        RoundResponse r = contestManagementService.getRound(roundId);
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime start = r.getStartAt();
        OffsetDateTime end = r.getEndAt();

        String status;
        long remaining = 0L;
        if (now.isBefore(start)) {
            status = "NOT_STARTED";
            remaining = Math.max(0, Duration.between(now, start).getSeconds());
        } else if (!now.isAfter(end)) {
            status = "RUNNING";
            remaining = Math.max(0, Duration.between(now, end).getSeconds());
        } else {
            status = "ENDED";
            remaining = 0L;
        }

        RoundCountdownResponse resp = RoundCountdownResponse.builder()
                .status(status)
                .remainingSeconds(remaining)
                .build();

        return ApiResponse.ok(resp);
    }
}
