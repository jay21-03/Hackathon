package com.seal.hackathon.authprofile.controller;

import com.seal.hackathon.authprofile.dto.AssignRoleRequest;
import com.seal.hackathon.authprofile.dto.AuthResponse;
import com.seal.hackathon.authprofile.dto.CurrentUserResponse;
import com.seal.hackathon.authprofile.dto.GoogleLoginRequest;
import com.seal.hackathon.authprofile.dto.UpdateProfileRequest;
import com.seal.hackathon.authprofile.dto.UserSummaryResponse;
import com.seal.hackathon.authprofile.service.AuthProfileService;
import com.seal.hackathon.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class AuthProfileController {

    private final AuthProfileService authProfileService;

    public AuthProfileController(AuthProfileService authProfileService) {
        this.authProfileService = authProfileService;
    }

    @PostMapping("/auth/google-login")
    public ApiResponse<AuthResponse> googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        return ApiResponse.ok(authProfileService.googleLogin(request.getIdToken()));
    }

    @GetMapping("/me")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<CurrentUserResponse> getMyProfile() {
        return ApiResponse.ok(authProfileService.getCurrentUserProfile());
    }

    @PutMapping("/me/profile")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<CurrentUserResponse> updateMyProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return ApiResponse.ok(authProfileService.updateProfile(request));
    }

    @GetMapping("/admin/users")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<List<UserSummaryResponse>> listUsers() {
        return ApiResponse.ok(authProfileService.listUsers());
    }

    @PostMapping("/admin/users/{userId}/roles")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<UserSummaryResponse> assignRole(
            @PathVariable Long userId,
            @Valid @RequestBody AssignRoleRequest request) {
        return ApiResponse.ok(authProfileService.assignRole(userId, request));
    }
}
