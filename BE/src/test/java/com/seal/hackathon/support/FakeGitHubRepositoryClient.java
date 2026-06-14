package com.seal.hackathon.support;

import com.seal.hackathon.github.client.GitHubCommitInfo;
import com.seal.hackathon.github.client.GitHubRepositoryClient;
import com.seal.hackathon.github.client.GitHubRepositoryInfo;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

public class FakeGitHubRepositoryClient implements GitHubRepositoryClient {

    private final AtomicLong idSequence = new AtomicLong(9000);
    private final Map<String, GitHubRepositoryInfo> repositories = new ConcurrentHashMap<>();
    private final Map<String, String> collaboratorPermissions = new ConcurrentHashMap<>();
    private final Map<String, GitHubCommitInfo> latestCommits = new ConcurrentHashMap<>();
    private final Map<String, Boolean> protectedBranches = new ConcurrentHashMap<>();

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
        stubLatestCommit(
                org,
                newRepoName,
                created.getDefaultBranch(),
                GitHubCommitInfo.builder()
                        .sha("abc123def4567890")
                        .message("Initial commit")
                        .authorName("Test Author")
                        .authorEmail("test@example.com")
                        .committedAt(OffsetDateTime.now())
                        .htmlUrl(created.getHtmlUrl() + "/commit/abc123def4567890")
                        .build());
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
    public void protectBranchFromPush(String owner, String repo, String branch) {
        String resolvedBranch = branch == null || branch.isBlank() ? "main" : branch.trim();
        protectedBranches.put(branchKey(owner, repo, resolvedBranch), true);
    }

    @Override
    public Optional<GitHubRepositoryInfo> getRepository(String owner, String repo) {
        return Optional.ofNullable(repositories.get(repoKey(owner, repo)));
    }

    @Override
    public Optional<String> getCollaboratorPermission(String owner, String repo, String username) {
        return Optional.ofNullable(collaboratorPermissions.get(collaboratorKey(owner, repo, username)));
    }

    @Override
    public Optional<GitHubCommitInfo> getLatestCommit(String owner, String repo, String branch) {
        String resolvedBranch = branch == null || branch.isBlank() ? "main" : branch.trim();
        return Optional.ofNullable(latestCommits.get(commitKey(owner, repo, resolvedBranch)));
    }

    public void stubLatestCommit(String owner, String repo, String branch, GitHubCommitInfo commit) {
        String resolvedBranch = branch == null || branch.isBlank() ? "main" : branch.trim();
        latestCommits.put(commitKey(owner, repo, resolvedBranch), commit);
    }

    public String collaboratorPermission(String owner, String repo, String username) {
        return collaboratorPermissions.get(collaboratorKey(owner, repo, username));
    }

    public boolean isBranchProtected(String owner, String repo, String branch) {
        String resolvedBranch = branch == null || branch.isBlank() ? "main" : branch.trim();
        return Boolean.TRUE.equals(protectedBranches.get(branchKey(owner, repo, resolvedBranch)));
    }

    private String repoKey(String owner, String repo) {
        return owner + "/" + repo;
    }

    private String collaboratorKey(String owner, String repo, String username) {
        return owner + "/" + repo + "@" + username;
    }

    private String commitKey(String owner, String repo, String branch) {
        return owner + "/" + repo + "#" + branch;
    }

    private String branchKey(String owner, String repo, String branch) {
        return owner + "/" + repo + "#" + branch;
    }
}
