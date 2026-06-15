package com.seal.hackathon.github.client;

import java.time.OffsetDateTime;
import java.util.List;
import lombok.Builder;
import lombok.Singular;
import lombok.Value;

@Value
@Builder
public class GitHubCommitDetail {
    String sha;
    String message;
    String authorName;
    String authorEmail;
    OffsetDateTime committedAt;
    String htmlUrl;
    int additions;
    int deletions;
    @Singular
    List<GitHubCommitFileChange> files;

    @Value
    @Builder
    public static class GitHubCommitFileChange {
        String filename;
        String status;
        int additions;
        int deletions;
        String patch;
    }
}
