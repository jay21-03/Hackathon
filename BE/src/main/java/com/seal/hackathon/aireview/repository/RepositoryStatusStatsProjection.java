package com.seal.hackathon.aireview.repository;

public interface RepositoryStatusStatsProjection {
    Long getTotal();

    Long getOpenCount();

    Long getClosedCount();

    Long getPendingCount();

    Long getFailedCount();

    Long getCreatedCount();

    Long getGithubIssueCount();
}
