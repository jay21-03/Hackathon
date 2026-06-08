package com.seal.hackathon.github.client;

import java.util.Optional;

public interface GitHubRepositoryClient {
    GitHubRepositoryInfo createRepoFromTemplate(
            String templateOwner,
            String templateRepo,
            String org,
            String newRepoName,
            boolean privateRepo);

    void addCollaborator(String owner, String repo, String username, String permission);

    void updateCollaboratorPermission(String owner, String repo, String username, String permission);

    Optional<GitHubRepositoryInfo> getRepository(String owner, String repo);
}
