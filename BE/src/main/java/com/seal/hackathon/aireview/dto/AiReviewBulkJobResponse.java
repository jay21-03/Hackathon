package com.seal.hackathon.aireview.dto;

import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AiReviewBulkJobResponse {

    private String jobId;
    private Long eventId;
    private String status;
    private int total;
    private int processed;
    private int succeededCount;
    private int failedCount;
    private BulkAiReviewResponse result;
    private String errorMessage;
    private OffsetDateTime startedAt;
    private OffsetDateTime finishedAt;
}
