package com.seal.hackathon.registration.controller;

import com.seal.hackathon.authprofile.security.CurrentUserProvider;
import com.seal.hackathon.authprofile.security.CurrentUserPrincipal;
import com.seal.hackathon.common.response.ApiResponse;
import com.seal.hackathon.registration.dto.RegisterTeamRequest;
import com.seal.hackathon.registration.dto.TeamDetailDto;
import com.seal.hackathon.registration.service.RegistrationService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/events")
public class RegistrationController {

    private final RegistrationService registrationService;
    private final CurrentUserProvider currentUserProvider;

    @Autowired
    public RegistrationController(RegistrationService registrationService, CurrentUserProvider currentUserProvider) {
        this.registrationService = registrationService;
        this.currentUserProvider = currentUserProvider;
    }

    @PostMapping("/{eventId}/teams")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<TeamDetailDto>> registerTeam(
            @PathVariable Long eventId,
            @Valid @RequestBody RegisterTeamRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey
    ) {
        CurrentUserPrincipal currentUser = currentUserProvider.getCurrentUser();
        String requestPath = "/api/v1/events/" + eventId + "/teams";
        TeamDetailDto dto = registrationService.registerTeam(
            eventId,
            request,
            currentUser.getUserId(),
            currentUser.getEmail(),
            idempotencyKey,
            requestPath);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}")
                .buildAndExpand(dto.getId()).toUri();

        return ResponseEntity.created(location).body(ApiResponse.ok(dto));
    }
}
