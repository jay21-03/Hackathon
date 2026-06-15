package com.seal.hackathon.aireview.service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AiReviewAsyncTrigger {

    private final AiReviewService aiReviewService;
    private final TaskScheduler taskScheduler;
    private final Map<Long, ScheduledFuture<?>> pendingByRepositoryId = new ConcurrentHashMap<>();

    @Value("${app.ai.review.webhook-debounce-ms:60000}")
    private long webhookDebounceMs;

    public void scheduleAfterPush(Long teamRepositoryId) {
        if (teamRepositoryId == null) {
            return;
        }
        long delayMs = Math.max(webhookDebounceMs, 1_000L);
        pendingByRepositoryId.compute(teamRepositoryId, (id, existing) -> {
            if (existing != null && !existing.isDone()) {
                existing.cancel(false);
            }
            Instant runAt = Instant.now().plusMillis(delayMs);
            return taskScheduler.schedule(
                    () -> {
                        pendingByRepositoryId.remove(id);
                        aiReviewService.triggerReviewForRepository(id);
                    },
                    runAt);
        });
    }
}
