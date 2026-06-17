package com.seal.hackathon.aireview.webhook;

import com.seal.hackathon.aireview.dto.N8nLegacyRepoItem;
import com.seal.hackathon.aireview.service.AiReviewService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/webhooks/n8n/ai-review")
@RequiredArgsConstructor
public class N8nAiReviewWebhookController {

    private final AiReviewService aiReviewService;

    @Value("${app.ai.review.n8n-webhook-secret:}")
    private String n8nWebhookSecret;

    @PostMapping("/run-due")
    public ResponseEntity<Integer> runDue(@RequestHeader(value = "X-N8N-Secret", required = false) String secret) {
        verifySecret(secret);
        return ResponseEntity.ok(aiReviewService.runDueReviews());
    }

    @PostMapping("/retry-failed")
    public ResponseEntity<Integer> retryFailed(@RequestHeader(value = "X-N8N-Secret", required = false) String secret) {
        verifySecret(secret);
        return ResponseEntity.ok(aiReviewService.retryAllFailedReviews());
    }

    @GetMapping("/legacy-repos")
    public ResponseEntity<List<N8nLegacyRepoItem>> legacyRepos(
            @RequestHeader(value = "X-N8N-Secret", required = false) String secret) {
        verifySecret(secret);
        return ResponseEntity.ok(aiReviewService.listProvisionedReposForLegacyN8n());
    }

    private void verifySecret(String secret) {
        if (!StringUtils.hasText(n8nWebhookSecret)) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "N8N_WEBHOOK_NOT_CONFIGURED");
        }
        if (!StringUtils.hasText(secret) || !n8nWebhookSecret.trim().equals(secret.trim())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "INVALID_N8N_WEBHOOK_SECRET");
        }
    }
}
