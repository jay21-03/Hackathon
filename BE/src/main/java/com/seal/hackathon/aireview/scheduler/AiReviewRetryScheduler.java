package com.seal.hackathon.aireview.scheduler;

import com.seal.hackathon.aireview.service.AiReviewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.ai.review.retry-failed-enabled", havingValue = "true")
public class AiReviewRetryScheduler {

    private final AiReviewService aiReviewService;

    @Scheduled(
            initialDelayString = "${app.ai.review.retry-failed-initial-delay-ms:300000}",
            fixedDelayString = "${app.ai.review.retry-failed-poll-ms:600000}")
    public void retryFailedReviews() {
        int retried = aiReviewService.retryAllFailedReviews();
        if (retried > 0) {
            log.info("AI review retry scheduler: retriedTeams={}", retried);
        }
    }
}
