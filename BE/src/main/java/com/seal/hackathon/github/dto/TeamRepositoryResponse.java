package com.seal.hackathon.github.dto;

import com.seal.hackathon.common.enums.RepositoryAccessStatus;
import com.seal.hackathon.common.enums.RepositoryProvisionStatus;
import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class TeamRepositoryResponse {
    Long id;
    Long teamId;
    String teamName;
    Long roundId;
    Long boardId;
    Long problemId;
    String repositoryUrl;
    String repositoryName;
    String githubOwner;
    String githubRepoName;
    Long githubRepoId;
    RepositoryAccessStatus accessStatus;
    RepositoryProvisionStatus provisionStatus;
    OffsetDateTime openedAt;
    OffsetDateTime closedAt;
    OffsetDateTime provisionedAt;
    String lastError;
    OffsetDateTime createdAt;
    OffsetDateTime updatedAt;
}
