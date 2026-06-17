package com.seal.hackathon.aireview.dto;

import java.time.OffsetDateTime;

public record BackfillCommitsRequest(
        OffsetDateTime since,
        OffsetDateTime until,
        Boolean runReview) {}
