package com.seal.hackathon.academic.dto;

import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TermRepositoryResponse {
    private Long id;
    private Long teamId;
    private Long roundId;
    private Long boardId;
    private Long problemId;
    private String githubRepoName;
    private String repositoryUrl;
    private String provisionStatus;
    private OffsetDateTime createdAt;
}
