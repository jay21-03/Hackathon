package com.seal.hackathon.assignment.controller;

import com.seal.hackathon.assignment.dto.StaffCarryoverRequest;
import com.seal.hackathon.assignment.dto.StaffCarryoverResponse;
import com.seal.hackathon.assignment.service.StaffCarryoverService;
import com.seal.hackathon.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class StaffCarryoverController {

    private final StaffCarryoverService staffCarryoverService;

    @PostMapping("/events/{eventId}/staff-carryover")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<StaffCarryoverResponse> carryover(
            @PathVariable Long eventId, @Valid @RequestBody StaffCarryoverRequest request) {
        return ApiResponse.ok(staffCarryoverService.carryoverForEvent(eventId, request));
    }
}
