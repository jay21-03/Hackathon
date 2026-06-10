package com.seal.hackathon.github.dto;

import com.seal.hackathon.common.enums.RepositoryAccessStatus;
import com.seal.hackathon.common.enums.RepositoryProvisionStatus;
import com.seal.hackathon.common.enums.SubmissionStatus;
import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class JudgeRepositoryResponse {
    Long id;
    Long teamId;
    String teamName;
    Long roundId;
    Long boardId;
    String boardName;
    Long problemId;
    String problemTitle;
    String repositoryUrl;
    String cloneUrl;
    String repositoryName;
    String githubOwner;
    String githubRepoName;
    RepositoryAccessStatus accessStatus;
    RepositoryProvisionStatus provisionStatus;
    SubmissionStatus submissionStatus;
    OffsetDateTime submittedAt;
    OffsetDateTime openedAt;
    OffsetDateTime closedAt;
    OffsetDateTime provisionedAt;
    OffsetDateTime lastPushAt;
    String judgeGithubUsername;
    boolean judgeHasGithubUsername;
    Boolean judgeGithubAccessGranted;
}
