package com.seal.hackathon.github.client;

import java.time.OffsetDateTime;
import java.util.List;
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

    void protectBranchFromPush(String owner, String repo, String branch);

    Optional<GitHubRepositoryInfo> getRepository(String owner, String repo);

    /** Returns collaborator permission (e.g. pull, push) if the user has access. */
    Optional<String> getCollaboratorPermission(String owner, String repo, String username);

    /** Latest commit on the given branch (empty repository returns empty). */
    Optional<GitHubCommitInfo> getLatestCommit(String owner, String repo, String branch);

    /**
     * Commits on a branch within an optional time window (newest first).
     * Paginates GitHub API until {@code maxCommits} is reached or no more pages.
     */
    List<GitHubCommitInfo> listCommitsSince(
            String owner,
            String repo,
            String branch,
            OffsetDateTime since,
            OffsetDateTime until,
            int maxCommits);

    /** Full commit payload including per-file patches when GitHub returns them. */
    Optional<GitHubCommitDetail> getCommitDetail(String owner, String repo, String sha);

    /** Creates a repository issue (requires token with issues write permission). */
    GitHubIssueInfo createIssue(String owner, String repo, String title, String bodyMarkdown);

    /**
     * Ensures a push webhook exists for the repository (idempotent).
     * Requires admin access on the repository and {@code admin:repo_hook} on the token.
     */
    void ensurePushWebhook(String owner, String repo, String payloadUrl, String secret);
}
