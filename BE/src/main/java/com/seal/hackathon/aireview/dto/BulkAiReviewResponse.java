package com.seal.hackathon.aireview.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BulkAiReviewResponse {

    private int total;
    private int succeededCount;
    private int failedCount;
    private List<AiReviewResponse> succeeded;
    private List<BulkAiReviewFailure> failed;
}
