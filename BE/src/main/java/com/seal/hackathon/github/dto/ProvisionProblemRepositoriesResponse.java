package com.seal.hackathon.github.dto;

import java.util.List;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ProvisionProblemRepositoriesResponse {
    Long problemId;
    Long boardId;
    Long roundId;
    int totalTeams;
    int createdCount;
    int failedCount;
    int skippedCount;
    List<TeamRepositoryResponse> repositories;
}
