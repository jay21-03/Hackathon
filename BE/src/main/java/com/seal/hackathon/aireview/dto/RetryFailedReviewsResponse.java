package com.seal.hackathon.aireview.dto;

import java.util.List;

public record RetryFailedReviewsResponse(
        int teamsAttempted, int teamsSucceeded, int teamsFailed, List<BulkAiReviewFailure> failures) {}
