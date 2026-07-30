package com.seal.hackathon.scoring.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DemoScoringCompletionResponse {
    private Long eventId;
    private Integer roundsProcessed;
    private Integer boardsProcessed;
    private Integer judgesCreated;
    private Integer judgeAssignmentsCreated;
    private Integer submittedSheetsPreserved;
    private Integer scoreSheetsCreated;
    private Integer draftSheetsCompleted;
    private Integer scoreSheetsSubmitted;
    private Integer scoreItemsCopied;
    private Integer scoreItemsCreated;
    private Integer skippedTeamsWithoutSample;
    private Integer repositoriesPrepared;
    private java.util.List<String> teamsSkipped;
    private java.util.List<String> warnings;
}
