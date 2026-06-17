package com.seal.hackathon.aireview.dto;

import java.time.OffsetDateTime;
import lombok.Builder;

@Builder
public record AiReviewHealthResponse(
        Long eventId,
        boolean aiConfigured,
        boolean schedulerEnabled,
        boolean webhookReviewEnabled,
        int teamsWithRepository,
        int teamsWithCompletedReview,
        int teamsWithFailedReview,
        int teamsPendingReview,
        int totalFailedReviews,
        OffsetDateTime oldestFailedReviewAt,
        String recommendation) {}
