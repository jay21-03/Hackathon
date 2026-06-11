package com.seal.hackathon.common.util;

import java.net.URI;
import java.util.Locale;
import java.util.Optional;
import org.springframework.util.StringUtils;

public record GitHubRepoCoordinates(String owner, String repoName) {

    public static Optional<GitHubRepoCoordinates> fromTeamRepository(
            String githubOwner, String githubRepoName, String repositoryUrl) {
        if (StringUtils.hasText(githubOwner) && StringUtils.hasText(githubRepoName)) {
            return Optional.of(new GitHubRepoCoordinates(githubOwner.trim(), githubRepoName.trim()));
        }
        return fromRepositoryUrl(repositoryUrl);
    }

    public static Optional<GitHubRepoCoordinates> fromRepositoryUrl(String repositoryUrl) {
        if (!StringUtils.hasText(repositoryUrl)) {
            return Optional.empty();
        }
        try {
            URI uri = URI.create(repositoryUrl.trim());
            String host = uri.getHost();
            if (host == null) {
                return Optional.empty();
            }
            String lower = host.toLowerCase(Locale.ROOT);
            if (!lower.equals("github.com") && !lower.endsWith(".github.com")) {
                return Optional.empty();
            }
            String path = uri.getPath();
            if (!StringUtils.hasText(path)) {
                return Optional.empty();
            }
            String[] segments = path.split("/");
            if (segments.length < 3) {
                return Optional.empty();
            }
            String owner = segments[1];
            String repo = segments[2];
            if (repo.endsWith(".git")) {
                repo = repo.substring(0, repo.length() - 4);
            }
            if (!StringUtils.hasText(owner) || !StringUtils.hasText(repo)) {
                return Optional.empty();
            }
            return Optional.of(new GitHubRepoCoordinates(owner, repo));
        } catch (Exception ex) {
            return Optional.empty();
        }
    }
}
