package com.seal.hackathon.platform.controller;

import com.seal.hackathon.common.response.ApiResponse;
import com.seal.hackathon.platform.dto.SchedulerHealthResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/platform")
public class PlatformHealthController {

    @Value("${app.github.scheduler-enabled:false}")
    private boolean githubSchedulerEnabled;

    @Value("${app.ai.review.scheduler-enabled:false}")
    private boolean aiReviewSchedulerEnabled;

    @Value("${app.event.lifecycle.scheduler-enabled:true}")
    private boolean eventLifecycleSchedulerEnabled;

    @GetMapping("/scheduler-health")
    public ApiResponse<SchedulerHealthResponse> schedulerHealth() {
        String recommendation = null;
        if (!githubSchedulerEnabled || !aiReviewSchedulerEnabled) {
            recommendation =
                    "Một số scheduler nội bộ đang tắt — kiểm tra biến môi trường hoặc workflow n8n platform nếu dùng bridge.";
        }
        return ApiResponse.ok(SchedulerHealthResponse.builder()
                .githubSchedulerEnabled(githubSchedulerEnabled)
                .aiReviewSchedulerEnabled(aiReviewSchedulerEnabled)
                .eventLifecycleSchedulerEnabled(eventLifecycleSchedulerEnabled)
                .recommendation(recommendation)
                .build());
    }
}
