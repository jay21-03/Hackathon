package com.seal.hackathon.github.client;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class GitHubRepositoryInfo {
    Long id;
    String owner;
    String name;
    String htmlUrl;
    String defaultBranch;
}
