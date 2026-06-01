package com.seal.hackathon.registration.controller;

import com.seal.hackathon.authprofile.security.CurrentUserPrincipal;
import com.seal.hackathon.authprofile.security.CurrentUserProvider;
import com.seal.hackathon.common.response.ApiResponse;
import com.seal.hackathon.registration.dto.InvitationTokenRequest;
import com.seal.hackathon.registration.dto.ResendInvitationRequest;
import com.seal.hackathon.registration.dto.TeamDetailDto;
import com.seal.hackathon.registration.service.RegistrationService;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/team-invitations")
public class InvitationController {

    private final RegistrationService registrationService;
    private final CurrentUserProvider currentUserProvider;

    public InvitationController(RegistrationService registrationService, CurrentUserProvider currentUserProvider) {
        this.registrationService = registrationService;
        this.currentUserProvider = currentUserProvider;
    }

    @PostMapping("/confirm")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<TeamDetailDto>> confirm(@Valid @RequestBody InvitationTokenRequest request) {
        CurrentUserPrincipal currentUser = currentUserProvider.getCurrentUser();
        TeamDetailDto dto = registrationService.confirmInvitation(
                request.getToken(),
                currentUser.getUserId(),
                currentUser.getEmail());
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    @PostMapping("/decline")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<TeamDetailDto>> decline(@Valid @RequestBody InvitationTokenRequest request) {
        CurrentUserPrincipal currentUser = currentUserProvider.getCurrentUser();
        TeamDetailDto dto = registrationService.declineInvitation(
                request.getToken(),
                currentUser.getUserId(),
                currentUser.getEmail());
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    @PostMapping("/resend")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<TeamDetailDto>> resend(@Valid @RequestBody ResendInvitationRequest request) {
        CurrentUserPrincipal currentUser = currentUserProvider.getCurrentUser();
        boolean organizer = currentUser.getRoles() != null && currentUser.getRoles().contains("ORGANIZER");
        TeamDetailDto dto = registrationService.resendInvitation(
                request.getTeamMemberId(),
                currentUser.getUserId(),
                currentUser.getEmail(),
                organizer);
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }
}
