package com.seal.hackathon.submission.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventSubmissionSummaryResponse {
    private long totalTeams;
    private long submittedCount;
    private long draftCount;
}
