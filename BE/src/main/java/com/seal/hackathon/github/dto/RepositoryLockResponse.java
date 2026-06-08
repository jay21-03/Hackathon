package com.seal.hackathon.github.dto;

import java.util.List;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class RepositoryLockResponse {
    Long roundId;
    int totalRepositories;
    int lockedCount;
    int failedCount;
    List<TeamRepositoryResponse> repositories;
}
