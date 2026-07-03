package com.seal.hackathon.platform.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SchedulerHealthResponse {
    private boolean githubSchedulerEnabled;
    private boolean aiReviewSchedulerEnabled;
    private boolean aiReviewWebhookEnabled;
    private boolean n8nWebhookConfigured;
    private boolean githubWebhookConfigured;
    private boolean mailEnabled;
    private boolean eventLifecycleSchedulerEnabled;
    /** Gợi ý vận hành khi scheduler tắt (n8n bridge, v.v.). */
    private String recommendation;
}
