package com.seal.hackathon.aireview.support;

import com.seal.hackathon.github.client.GitHubCommitDetail;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.util.StringUtils;

public final class AiReviewDiffBuilder {

    private static final Set<String> IGNORED_FILES = Set.of(
            ".gitignore",
            "package-lock.json",
            "yarn.lock",
            ".env",
            "README.md");

    private static final int PATCH_LIMIT = 3_000;
    private static final int TOTAL_LIMIT = 50_000;

    private AiReviewDiffBuilder() {}

    public static String buildActivityLog(List<GitHubCommitDetail> commits) {
        StringBuilder builder = new StringBuilder();
        for (GitHubCommitDetail commit : commits) {
            if (!builder.isEmpty()) {
                builder.append('\n');
            }
            String shortSha = commit.getSha() == null ? "?" : commit.getSha().substring(0, Math.min(7, commit.getSha().length()));
            builder.append("Commit ")
                    .append(shortSha)
                    .append(": ")
                    .append(trim(commit.getMessage(), 200))
                    .append(" | files: ")
                    .append(countMeaningfulFiles(commit));
        }
        return builder.toString();
    }

    public static String buildCodeChangesDetail(List<GitHubCommitDetail> commits) {
        StringBuilder builder = new StringBuilder();
        for (GitHubCommitDetail commit : commits) {
            if (!builder.isEmpty()) {
                builder.append("\n=== COMMIT-BOUNDARY ===\n");
            }
            builder.append("SHA: ").append(commit.getSha()).append('\n');
            builder.append("Message: ").append(trim(commit.getMessage(), 500)).append('\n');
            for (GitHubCommitDetail.GitHubCommitFileChange file : commit.getFiles()) {
                if (!shouldIncludeFile(file.getFilename())) {
                    continue;
                }
                builder.append("\n--- ")
                        .append(file.getFilename())
                        .append(" (+")
                        .append(file.getAdditions())
                        .append("/-")
                        .append(file.getDeletions())
                        .append(") ---\n");
                String patch = file.getPatch();
                if (StringUtils.hasText(patch)) {
                    if (patch.length() > PATCH_LIMIT) {
                        patch = patch.substring(0, PATCH_LIMIT) + "\n... [Truncated] ...";
                    }
                    builder.append(patch);
                }
                if (builder.length() >= TOTAL_LIMIT) {
                    return builder.substring(0, TOTAL_LIMIT) + "\n... [Truncated total diff] ...";
                }
            }
        }
        if (builder.length() > TOTAL_LIMIT) {
            return builder.substring(0, TOTAL_LIMIT) + "\n... [Truncated total diff] ...";
        }
        return builder.toString();
    }

    private static int countMeaningfulFiles(GitHubCommitDetail commit) {
        Set<String> names = new LinkedHashSet<>();
        for (GitHubCommitDetail.GitHubCommitFileChange file : commit.getFiles()) {
            if (shouldIncludeFile(file.getFilename())) {
                names.add(file.getFilename());
            }
        }
        return names.size();
    }

    private static boolean shouldIncludeFile(String filename) {
        if (!StringUtils.hasText(filename)) {
            return false;
        }
        String normalized = filename.trim();
        if (IGNORED_FILES.contains(normalized)) {
            return false;
        }
        String lower = normalized.toLowerCase(Locale.ROOT);
        return !lower.endsWith(".lock");
    }

    private static String trim(String value, int max) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        String trimmed = value.trim().replace('\n', ' ');
        return trimmed.length() <= max ? trimmed : trimmed.substring(0, max) + "…";
    }
}
