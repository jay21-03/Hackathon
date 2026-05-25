package com.seal.hackathon.authprofile.controller;

import com.seal.hackathon.common.response.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth-profile")
public class AuthProfileController {

    @GetMapping("/me")
    public ApiResponse<String> getMyProfile() {
        return ApiResponse.ok("Profile endpoint skeleton");
    }
}
