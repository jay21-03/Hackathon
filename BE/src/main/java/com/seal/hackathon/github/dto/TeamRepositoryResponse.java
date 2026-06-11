package com.seal.hackathon.github.dto;

import com.seal.hackathon.common.enums.RepositoryAccessStatus;
import com.seal.hackathon.common.enums.RepositoryProvisionStatus;
import com.seal.hackathon.common.enums.SubmissionStatus;
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
    String roundName;
    /** Vòng thi mà đội đang tham gia (theo phân bảng hiện tại). */
    Boolean currentRound;
    Long boardId;
    Long problemId;
    String repositoryUrl;
    String repositoryName;
    String githubOwner;
    String githubRepoName;
    Long githubRepoId;
    RepositoryAccessStatus accessStatus;
    RepositoryProvisionStatus provisionStatus;
    SubmissionStatus submissionStatus;
    OffsetDateTime submittedAt;
    OffsetDateTime openedAt;
    OffsetDateTime closedAt;
    OffsetDateTime provisionedAt;
    OffsetDateTime lastPushAt;
    String lastError;
    OffsetDateTime createdAt;
    OffsetDateTime updatedAt;
    RepoCommitResponse latestCommit;
}
