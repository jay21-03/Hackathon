package com.seal.hackathon.aireview.scheduler;

import com.seal.hackathon.aireview.service.AiReviewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AiReviewScheduler {

    private final AiReviewService aiReviewService;

    // AI review runs every 30 minutes by default and is advisory only.
    // It must NOT change official scoring or ranking.
    @Scheduled(fixedDelayString = "#{${app.ai-review-interval-minutes:30} * 60 * 1000}")
    public void runScheduledAiReview() {
        var result = aiReviewService.runScheduledReview();
        log.info("Scheduled AI review finished. reviewedTeamCount={}, status={}",
                result.reviewedTeamCount(), result.status());
    }
}
