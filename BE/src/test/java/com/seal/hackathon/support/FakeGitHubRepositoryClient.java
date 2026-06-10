package com.seal.hackathon.support;

import com.seal.hackathon.github.client.GitHubRepositoryClient;
import com.seal.hackathon.github.client.GitHubRepositoryInfo;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

public class FakeGitHubRepositoryClient implements GitHubRepositoryClient {

    private final AtomicLong idSequence = new AtomicLong(9000);
    private final Map<String, GitHubRepositoryInfo> repositories = new ConcurrentHashMap<>();
    private final Map<String, String> collaboratorPermissions = new ConcurrentHashMap<>();

    @Override
    public GitHubRepositoryInfo createRepoFromTemplate(
            String templateOwner,
            String templateRepo,
            String org,
            String newRepoName,
            boolean privateRepo) {
        String key = repoKey(org, newRepoName);
        GitHubRepositoryInfo existing = repositories.get(key);
        if (existing != null) {
            return existing;
        }
        GitHubRepositoryInfo created = GitHubRepositoryInfo.builder()
                .id(idSequence.incrementAndGet())
                .owner(org)
                .name(newRepoName)
                .htmlUrl("https://github.com/" + org + "/" + newRepoName)
                .defaultBranch("main")
                .build();
        repositories.put(key, created);
        return created;
    }

    @Override
    public void addCollaborator(String owner, String repo, String username, String permission) {
        updateCollaboratorPermission(owner, repo, username, permission);
    }

    @Override
    public void updateCollaboratorPermission(String owner, String repo, String username, String permission) {
        collaboratorPermissions.put(collaboratorKey(owner, repo, username), permission);
    }

    @Override
    public Optional<GitHubRepositoryInfo> getRepository(String owner, String repo) {
        return Optional.ofNullable(repositories.get(repoKey(owner, repo)));
    }

    @Override
    public Optional<String> getCollaboratorPermission(String owner, String repo, String username) {
        return Optional.ofNullable(collaboratorPermissions.get(collaboratorKey(owner, repo, username)));
    }

    public String collaboratorPermission(String owner, String repo, String username) {
        return collaboratorPermissions.get(collaboratorKey(owner, repo, username));
    }

    private String repoKey(String owner, String repo) {
        return owner + "/" + repo;
    }

    private String collaboratorKey(String owner, String repo, String username) {
        return owner + "/" + repo + "@" + username;
    }
}
