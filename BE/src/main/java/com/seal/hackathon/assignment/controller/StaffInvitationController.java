package com.seal.hackathon.assignment.controller;

import com.seal.hackathon.assignment.dto.BulkCreateStaffInvitationRequest;
import com.seal.hackathon.assignment.dto.BulkStaffInvitationResponse;
import com.seal.hackathon.assignment.dto.CreateStaffInvitationRequest;
import com.seal.hackathon.assignment.dto.ResendStaffInvitationRequest;
import com.seal.hackathon.assignment.dto.StaffInvitationResponse;
import com.seal.hackathon.common.enums.StaffInvitationStatus;
import com.seal.hackathon.authprofile.security.CurrentUserProvider;
import com.seal.hackathon.common.idempotency.IdempotencyExecutor;
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
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class StaffInvitationController {

    private final StaffInvitationService staffInvitationService;
    private final IdempotencyExecutor idempotencyExecutor;
    private final CurrentUserProvider currentUserProvider;

    @GetMapping("/events/{eventId}/staff-invitations")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<?> listPending(
            @PathVariable Long eventId,
            @RequestParam(required = false) Long roundId,
            @RequestParam(required = false) Long boardId,
            @RequestParam(required = false) SystemRole role,
            @RequestParam(required = false) StaffInvitationStatus status,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        if (page != null || size != null) {
            int resolvedPage = page != null ? page : 0;
            int resolvedSize = size != null ? size : 25;
            return ApiResponse.ok(staffInvitationService.listFiltered(
                    eventId, roundId, boardId, role, status, email, resolvedPage, resolvedSize));
        }
        return ApiResponse.ok(staffInvitationService.listPending(eventId, roundId, boardId, role));
    }

    @PostMapping("/boards/{boardId}/staff-invitations")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<StaffInvitationResponse> create(
            @PathVariable Long boardId,
            @Valid @RequestBody CreateStaffInvitationRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        Long userId = currentUserProvider.getCurrentUser().getUserId();
        String path = "/api/v1/boards/" + boardId + "/staff-invitations";
        return ApiResponse.ok(idempotencyExecutor.execute(
                userId,
                idempotencyKey,
                "POST",
                path,
                request,
                StaffInvitationResponse.class,
                () -> staffInvitationService.create(boardId, request)));
    }

    @PostMapping("/boards/{boardId}/staff-invitations/bulk")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<BulkStaffInvitationResponse> createBulk(
            @PathVariable Long boardId,
            @Valid @RequestBody BulkCreateStaffInvitationRequest request) {
        return ApiResponse.ok(staffInvitationService.createBulk(boardId, request));
    }

    @PostMapping("/events/{eventId}/staff-invitations/bulk")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<BulkStaffInvitationResponse> createBulkForEvent(
            @PathVariable Long eventId,
            @Valid @RequestBody BulkCreateStaffInvitationRequest request) {
        return ApiResponse.ok(staffInvitationService.createBulkForEvent(eventId, request));
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
