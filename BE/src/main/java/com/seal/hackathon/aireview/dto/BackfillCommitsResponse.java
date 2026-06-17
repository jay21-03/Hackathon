package com.seal.hackathon.aireview.dto;

import java.time.OffsetDateTime;

public record BackfillCommitsResponse(
        Long teamId,
        int commitsImported,
        int commitsSkipped,
        int commitsFetched,
        OffsetDateTime since,
        OffsetDateTime until,
        boolean reviewTriggered) {}
