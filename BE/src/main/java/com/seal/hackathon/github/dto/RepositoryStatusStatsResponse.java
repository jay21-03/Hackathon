package com.seal.hackathon.github.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RepositoryStatusStatsResponse {
    private long total;
    private long open;
    private long closed;
    private long pending;
    private long failed;
    private long created;
    private long githubIssueCount;
}
