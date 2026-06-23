package com.seal.hackathon.contest.dto;

import com.seal.hackathon.github.dto.RepositoryStatusStatsResponse;
import com.seal.hackathon.submission.dto.EventSubmissionSummaryResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventArtifactsSummaryResponse {
    private EventSubmissionSummaryResponse submissions;
    private RepositoryStatusStatsResponse repositories;
}
