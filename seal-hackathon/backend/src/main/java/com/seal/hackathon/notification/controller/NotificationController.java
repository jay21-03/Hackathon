package com.seal.hackathon.notification.controller;

import com.seal.hackathon.common.response.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @GetMapping("/health")
    public ApiResponse<String> health() {
        return ApiResponse.ok("Notification API skeleton");
    }
}
