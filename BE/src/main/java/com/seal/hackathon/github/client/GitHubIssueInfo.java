package com.seal.hackathon.github.client;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GitHubIssueInfo {
    private Long number;
    private String htmlUrl;
    private String title;
}
