package com.seal.hackathon.github.client;

import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class GitHubCommitInfo {
    String sha;
    String message;
    String authorName;
    String authorEmail;
    OffsetDateTime committedAt;
    String htmlUrl;
}
