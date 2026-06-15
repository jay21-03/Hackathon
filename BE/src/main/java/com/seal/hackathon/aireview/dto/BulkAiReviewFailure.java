package com.seal.hackathon.aireview.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BulkAiReviewFailure {

    private Long teamId;
    private String teamName;
    private String reason;
}
