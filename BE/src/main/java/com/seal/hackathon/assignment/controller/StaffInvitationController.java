package com.seal.hackathon.assignment.controller;

import com.seal.hackathon.assignment.dto.CreateStaffInvitationRequest;
import com.seal.hackathon.assignment.dto.ResendStaffInvitationRequest;
import com.seal.hackathon.assignment.dto.StaffInvitationResponse;
import com.seal.hackathon.assignment.service.StaffInvitationService;
import com.seal.hackathon.common.enums.SystemRole;
import com.seal.hackathon.common.response.ApiResponse;
import com.seal.hackathon.registration.dto.InvitationTokenRequest;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class StaffInvitationController {

    private final StaffInvitationService staffInvitationService;

    @GetMapping("/events/{eventId}/staff-invitations")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<List<StaffInvitationResponse>> listPending(
            @PathVariable Long eventId,
            @RequestParam(required = false) Long boardId,
            @RequestParam(required = false) SystemRole role) {
        return ApiResponse.ok(staffInvitationService.listPending(eventId, boardId, role));
    }

    @PostMapping("/boards/{boardId}/staff-invitations")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<StaffInvitationResponse> create(
            @PathVariable Long boardId, @Valid @RequestBody CreateStaffInvitationRequest request) {
        return ApiResponse.ok(staffInvitationService.create(boardId, request));
    }

    @PostMapping("/staff-invitations/resend")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<StaffInvitationResponse> resend(@Valid @RequestBody ResendStaffInvitationRequest request) {
        return ApiResponse.ok(staffInvitationService.resend(request.getStaffInvitationId()));
    }

    @PostMapping("/staff-invitations/accept")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<StaffInvitationResponse> accept(@Valid @RequestBody InvitationTokenRequest request) {
        return ApiResponse.ok(staffInvitationService.accept(request.getToken()));
    }

    @PostMapping("/staff-invitations/decline")
    public ApiResponse<String> decline(@Valid @RequestBody InvitationTokenRequest request) {
        staffInvitationService.decline(request.getToken());
        return ApiResponse.ok("declined");
    }
}
