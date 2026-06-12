package com.seal.hackathon.authprofile.controller;

import com.seal.hackathon.authprofile.dto.AssignRoleRequest;
import com.seal.hackathon.authprofile.dto.AuthResponse;
import com.seal.hackathon.authprofile.dto.CurrentUserResponse;
import com.seal.hackathon.authprofile.dto.ForgotPasswordRequest;
import com.seal.hackathon.authprofile.dto.GoogleLoginRequest;
import com.seal.hackathon.authprofile.dto.LoginRequest;
import com.seal.hackathon.authprofile.dto.MessageResponse;
import com.seal.hackathon.authprofile.dto.RegisterRequest;
import com.seal.hackathon.authprofile.dto.ResetPasswordRequest;
import com.seal.hackathon.authprofile.dto.SetPasswordRequest;
import com.seal.hackathon.authprofile.dto.UpdateProfileRequest;
import com.seal.hackathon.authprofile.dto.UpdateUserApprovalRequest;
import com.seal.hackathon.authprofile.dto.UserSummaryResponse;
import com.seal.hackathon.authprofile.service.AuthProfileService;
import com.seal.hackathon.authprofile.service.PasswordResetService;
import com.seal.hackathon.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
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
    private final PasswordResetService passwordResetService;

    public AuthProfileController(AuthProfileService authProfileService, PasswordResetService passwordResetService) {
        this.authProfileService = authProfileService;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/auth/google-login")
    public ApiResponse<AuthResponse> googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        return ApiResponse.ok(authProfileService.googleLogin(request.getIdToken()));
    }

    @PostMapping("/auth/register")
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.ok(authProfileService.register(request));
    }

    @PostMapping("/auth/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok(authProfileService.login(request));
    }

    @PostMapping("/auth/forgot-password")
    public ApiResponse<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ApiResponse.ok(passwordResetService.requestPasswordReset(request));
    }

    @PostMapping("/auth/reset-password")
    public ApiResponse<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return ApiResponse.ok(passwordResetService.resetPassword(request));
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

    @PutMapping("/me/password")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<CurrentUserResponse> setPassword(@Valid @RequestBody SetPasswordRequest request) {
        return ApiResponse.ok(authProfileService.setPassword(request));
    }

    @GetMapping("/admin/users")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<com.seal.hackathon.common.response.PagedResult<UserSummaryResponse>> listUsers(
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "0") int page,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "50") int size,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String q) {
        return ApiResponse.ok(authProfileService.listUsersPaged(page, size, q));
    }

    @PostMapping("/admin/users/{userId}/roles")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<UserSummaryResponse> assignRole(
            @PathVariable Long userId,
            @Valid @RequestBody AssignRoleRequest request) {
        return ApiResponse.ok(authProfileService.assignRole(userId, request));
    }

    @PatchMapping("/admin/users/{userId}/approval")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<UserSummaryResponse> updateUserApproval(
            @PathVariable Long userId,
            @Valid @RequestBody UpdateUserApprovalRequest request) {
        return ApiResponse.ok(authProfileService.updateUserApproval(userId, request));
    }
}
