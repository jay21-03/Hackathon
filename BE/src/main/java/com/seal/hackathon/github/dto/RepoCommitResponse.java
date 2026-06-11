package com.seal.hackathon.github.dto;

import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class RepoCommitResponse {
    Long id;
    Long teamRepositoryId;
    String sha;
    String message;
    String authorName;
    String authorEmail;
    OffsetDateTime committedAt;
    String htmlUrl;
    String branch;
    OffsetDateTime capturedAt;
}
