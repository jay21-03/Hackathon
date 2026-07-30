package com.seal.hackathon.aireview.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import java.time.Duration;
import java.time.OffsetDateTime;

public record BackfillCommitsRequest(
        @NotNull(message = "BACKFILL_SINCE_REQUIRED")
        OffsetDateTime since,
        OffsetDateTime until,
        Boolean runReview) {

    private static final Duration MAX_BACKFILL_RANGE = Duration.ofDays(90);

    @AssertTrue(message = "BACKFILL_INVALID_RANGE")
    @JsonIgnore
    public boolean isRangeOrdered() {
        return since == null || until == null || !until.isBefore(since);
    }

    @AssertTrue(message = "BACKFILL_RANGE_TOO_LARGE")
    @JsonIgnore
    public boolean isRangeWithinLimit() {
        if (since == null) {
            return true;
        }
        OffsetDateTime effectiveUntil = until != null ? until : OffsetDateTime.now();
        return Duration.between(since, effectiveUntil).compareTo(MAX_BACKFILL_RANGE) <= 0;
    }
}
