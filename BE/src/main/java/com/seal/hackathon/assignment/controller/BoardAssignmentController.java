package com.seal.hackathon.assignment.controller;

import com.seal.hackathon.assignment.service.BoardAssignmentService;
import com.seal.hackathon.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/board-assignments")
@RequiredArgsConstructor
public class BoardAssignmentController {

    private final BoardAssignmentService boardAssignmentService;

    @GetMapping("/health")
    public ApiResponse<String> health() {
        return ApiResponse.ok(boardAssignmentService.skeletonStatus());
    }
}
