package com.seal.hackathon.registration.controller;

import com.seal.hackathon.common.response.ApiResponse;
import com.seal.hackathon.registration.service.TeamRegistrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/team-registrations")
@RequiredArgsConstructor
public class TeamRegistrationController {

    private final TeamRegistrationService teamRegistrationService;

    @GetMapping("/health")
    public ApiResponse<String> health() {
        return ApiResponse.ok(teamRegistrationService.skeletonStatus());
    }
}
