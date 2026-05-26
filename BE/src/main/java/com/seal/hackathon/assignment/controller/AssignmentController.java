package com.seal.hackathon.assignment.controller;

import com.seal.hackathon.common.response.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {

    @GetMapping("/health")
    public ApiResponse<String> health() {
        return ApiResponse.ok("Mentor/Judge assignment API skeleton");
    }
}
