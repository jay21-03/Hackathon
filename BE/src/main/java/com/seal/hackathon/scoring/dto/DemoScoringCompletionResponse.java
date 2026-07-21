package com.seal.hackathon.scoring.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DemoScoringCompletionResponse {
    private Long eventId;
    private Integer boardsProcessed;
    private Integer scoreSheetsCreated;
    private Integer scoreSheetsSubmitted;
    private Integer scoreItemsCopied;
    private Integer skippedTeamsWithoutSample;
}
