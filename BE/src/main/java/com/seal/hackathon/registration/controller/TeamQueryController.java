package com.seal.hackathon.registration.controller;

import com.seal.hackathon.authprofile.security.CurrentUserPrincipal;
import com.seal.hackathon.authprofile.security.CurrentUserProvider;
import com.seal.hackathon.common.response.ApiResponse;
import com.seal.hackathon.common.response.PagedResult;
import com.seal.hackathon.registration.dto.InviteTeamMemberRequest;
import com.seal.hackathon.registration.dto.UpdateTeamStatusRequest;
import com.seal.hackathon.registration.dto.TeamDetailDto;
import com.seal.hackathon.registration.service.RegistrationService;
import java.util.List;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1")
public class TeamQueryController {

    private final RegistrationService registrationService;
    private final CurrentUserProvider currentUserProvider;

    public TeamQueryController(RegistrationService registrationService, CurrentUserProvider currentUserProvider) {
        this.registrationService = registrationService;
        this.currentUserProvider = currentUserProvider;
    }

    @GetMapping("/my/teams")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<List<TeamDetailDto>>> getMyTeams(@RequestParam Long eventId) {
        CurrentUserPrincipal currentUser = currentUserProvider.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.ok(registrationService.getMyTeams(eventId, currentUser.getUserId())));
    }

    @GetMapping("/teams/{teamId}")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<TeamDetailDto>> getTeam(@PathVariable Long teamId) {
        CurrentUserPrincipal currentUser = currentUserProvider.getCurrentUser();
        boolean organizer = currentUser.getRoles() != null && currentUser.getRoles().contains("ORGANIZER");
        return ResponseEntity.ok(ApiResponse.ok(registrationService.getTeam(teamId, currentUser.getUserId(), organizer)));
    }

    @PostMapping("/teams/{teamId}/members")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<TeamDetailDto>> inviteTeamMember(
            @PathVariable Long teamId,
            @Valid @RequestBody InviteTeamMemberRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        CurrentUserPrincipal currentUser = currentUserProvider.getCurrentUser();
        boolean organizer = currentUser.getRoles() != null && currentUser.getRoles().contains("ORGANIZER");
        String requestPath = "/api/v1/teams/" + teamId + "/members";
        return ResponseEntity.ok(ApiResponse.ok(registrationService.inviteTeamMember(
                teamId,
                request.getMember(),
                currentUser.getUserId(),
                currentUser.getEmail(),
                organizer,
                idempotencyKey,
                requestPath)));
    }

    @DeleteMapping("/teams/{teamId}/members/{memberId}")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<TeamDetailDto>> cancelPendingInvitation(
            @PathVariable Long teamId,
            @PathVariable Long memberId) {
        CurrentUserPrincipal currentUser = currentUserProvider.getCurrentUser();
        boolean organizer = currentUser.getRoles() != null && currentUser.getRoles().contains("ORGANIZER");
        return ResponseEntity.ok(ApiResponse.ok(registrationService.cancelPendingInvitation(
                teamId,
                memberId,
                currentUser.getUserId(),
                currentUser.getEmail(),
                organizer)));
    }

    @PatchMapping("/teams/{teamId}/status")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<TeamDetailDto>> updateTeamStatus(@PathVariable Long teamId, @Valid @RequestBody UpdateTeamStatusRequest request) {
        CurrentUserPrincipal currentUser = currentUserProvider.getCurrentUser();
        boolean organizer = currentUser.getRoles() != null && currentUser.getRoles().contains("ORGANIZER");
        return ResponseEntity.ok(ApiResponse.ok(registrationService.updateTeamStatus(
                teamId,
                request.getStatus(),
                request.getReason(),
                currentUser.getUserId(),
                currentUser.getEmail(),
                organizer)));
    }

    @GetMapping("/events/{eventId}/teams")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<PagedResult<TeamDetailDto>>> getEventTeams(
            @PathVariable Long eventId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        CurrentUserPrincipal currentUser = currentUserProvider.getCurrentUser();
        if (currentUser == null || currentUser.getRoles() == null || !currentUser.getRoles().contains("ORGANIZER")) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN, "Forbidden");
        }
        com.seal.hackathon.common.enums.TeamStatus teamStatus = null;
        if (status != null && !status.isBlank()) {
            try {
                teamStatus = com.seal.hackathon.common.enums.TeamStatus.valueOf(status.trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_REQUEST, "Invalid team status");
            }
        }
        return ResponseEntity.ok(ApiResponse.ok(registrationService.getEventTeamsPaged(eventId, teamStatus, page, size)));
    }
}
