package com.seal.hackathon.registration.controller;

import com.seal.hackathon.authprofile.security.CurrentUserPrincipal;
import com.seal.hackathon.authprofile.security.CurrentUserProvider;
import com.seal.hackathon.common.response.ApiResponse;
import com.seal.hackathon.common.response.PagedResult;
import com.seal.hackathon.registration.dto.BulkInviteTeamMembersRequest;
import com.seal.hackathon.registration.dto.BulkTeamInvitationResponse;
import com.seal.hackathon.registration.dto.TeamInvitationResponse;
import com.seal.hackathon.registration.service.RegistrationService;
import com.seal.hackathon.registration.service.TeamInvitationService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
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
public class TeamInvitationController {

    private final TeamInvitationService teamInvitationService;
    private final RegistrationService registrationService;
    private final CurrentUserProvider currentUserProvider;

    @GetMapping("/events/{eventId}/team-invitations")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<PagedResult<TeamInvitationResponse>> listTeamInvitations(
            @PathVariable Long eventId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String email,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        return ApiResponse.ok(teamInvitationService.listInvitations(eventId, status, email, page, size));
    }

    @PostMapping("/teams/{teamId}/members/bulk")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<BulkTeamInvitationResponse> bulkInviteMembers(
            @PathVariable Long teamId,
            @Valid @RequestBody BulkInviteTeamMembersRequest request) {
        CurrentUserPrincipal currentUser = currentUserProvider.getCurrentUser();
        boolean organizer = currentUser.getRoles() != null && currentUser.getRoles().contains("ORGANIZER");
        return ApiResponse.ok(registrationService.bulkInviteTeamMembers(
                teamId,
                request,
                currentUser.getUserId(),
                currentUser.getEmail(),
                organizer));
    }
}
