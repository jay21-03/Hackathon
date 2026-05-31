package com.seal.hackathon.checkin.controller;

import com.seal.hackathon.checkin.service.CheckInService;
import com.seal.hackathon.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/check-ins")
@RequiredArgsConstructor
public class CheckInController {

    private final CheckInService checkInService;

    @GetMapping("/health")
    public ApiResponse<String> health() {
        return ApiResponse.ok(checkInService.skeletonStatus());
    }
}
