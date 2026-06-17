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
@ConditionalOnProperty(name = "app.ai.review.scheduler-enabled", havingValue = "true")
public class AiReviewScheduler {

    private final AiReviewService aiReviewService;

    @Scheduled(
            initialDelayString = "${app.ai.review.initial-delay-ms:120000}",
            fixedDelayString = "${app.ai.review.poll-ms:3600000}")
    public void runScheduledReviews() {
        int completed = aiReviewService.runDueReviews();
        log.info("AI review scheduler tick: completedReviews={}", completed);
    }
}
