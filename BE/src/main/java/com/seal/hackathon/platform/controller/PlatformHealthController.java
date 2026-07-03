package com.seal.hackathon.platform.controller;

import com.seal.hackathon.common.response.ApiResponse;
import com.seal.hackathon.platform.dto.SchedulerHealthResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.util.StringUtils;
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

    @Value("${app.ai.review.webhook-enabled:true}")
    private boolean aiReviewWebhookEnabled;

    @Value("${app.ai.review.n8n-webhook-secret:}")
    private String n8nWebhookSecret;

    @Value("${app.github.webhook-secret:}")
    private String githubWebhookSecret;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${app.event.lifecycle.scheduler-enabled:true}")
    private boolean eventLifecycleSchedulerEnabled;

    @GetMapping("/scheduler-health")
    public ApiResponse<SchedulerHealthResponse> schedulerHealth() {
        boolean n8nWebhookConfigured = StringUtils.hasText(n8nWebhookSecret);
        boolean githubWebhookConfigured = StringUtils.hasText(githubWebhookSecret);
        String recommendation = null;
        if (!aiReviewSchedulerEnabled && (aiReviewWebhookEnabled || n8nWebhookConfigured)) {
            recommendation = "AI review scheduler nội bộ đang tắt; hệ thống đang ưu tiên webhook/bridge nếu đã cấu hình.";
        } else if (!githubSchedulerEnabled || !aiReviewSchedulerEnabled) {
            recommendation = "Một số scheduler nội bộ đang tắt; kiểm tra biến môi trường hoặc bật webhook/n8n bridge.";
        } else if (!mailEnabled) {
            recommendation = "Email thật đang tắt; thông báo vẫn lưu trong app và log ở mock mode.";
        }

        return ApiResponse.ok(SchedulerHealthResponse.builder()
                .githubSchedulerEnabled(githubSchedulerEnabled)
                .aiReviewSchedulerEnabled(aiReviewSchedulerEnabled)
                .aiReviewWebhookEnabled(aiReviewWebhookEnabled)
                .n8nWebhookConfigured(n8nWebhookConfigured)
                .githubWebhookConfigured(githubWebhookConfigured)
                .mailEnabled(mailEnabled)
                .eventLifecycleSchedulerEnabled(eventLifecycleSchedulerEnabled)
                .recommendation(recommendation)
                .build());
    }
}
