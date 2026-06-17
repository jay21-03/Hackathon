package com.seal.hackathon.aireview.support;

import com.seal.hackathon.github.client.GitHubCommitDetail;
import java.util.ArrayList;
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

    private static final Set<String> CONFIG_FILE_NAMES = Set.of(
            "requirements.txt",
            "requirements-dev.txt",
            "pyproject.toml",
            "poetry.lock",
            "pipfile",
            "package.json",
            "docker-compose.yml",
            "docker-compose.yaml",
            "dockerfile",
            "makefile",
            "cargo.toml",
            "go.mod",
            ".env.example",
            "application.yml",
            "application.yaml",
            "application.properties",
            "tsconfig.json",
            "vite.config.ts",
            "vite.config.js");

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
            List<String> files = new ArrayList<>();
            for (GitHubCommitDetail.GitHubCommitFileChange file : commit.getFiles()) {
                if (shouldIncludeFile(file.getFilename())) {
                    files.add(file.getFilename().trim());
                }
            }
            builder.append(shortSha)
                    .append(": ")
                    .append(trim(commit.getMessage(), 200))
                    .append(" | ");
            if (files.isEmpty()) {
                builder.append("(no files)");
            } else {
                builder.append(String.join(", ", files));
            }
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

    public static String buildModifiedFilesList(List<GitHubCommitDetail> commits) {
        Set<String> files = collectMeaningfulFilenames(commits);
        if (files.isEmpty()) {
            return "(none)";
        }
        return String.join("\n", files);
    }

    public static String buildConfigFilesDetected(List<GitHubCommitDetail> commits) {
        List<String> configFiles = new ArrayList<>();
        for (String filename : collectMeaningfulFilenames(commits)) {
            if (isConfigFile(filename)) {
                configFiles.add(filename);
            }
        }
        if (configFiles.isEmpty()) {
            return "(none)";
        }
        return String.join("\n", configFiles);
    }

    private static Set<String> collectMeaningfulFilenames(List<GitHubCommitDetail> commits) {
        Set<String> names = new LinkedHashSet<>();
        for (GitHubCommitDetail commit : commits) {
            for (GitHubCommitDetail.GitHubCommitFileChange file : commit.getFiles()) {
                if (shouldIncludeFile(file.getFilename())) {
                    names.add(file.getFilename().trim());
                }
            }
        }
        return names;
    }

    private static boolean isConfigFile(String filename) {
        if (!StringUtils.hasText(filename)) {
            return false;
        }
        String normalized = filename.trim();
        String baseName = normalized.contains("/")
                ? normalized.substring(normalized.lastIndexOf('/') + 1)
                : normalized;
        String lower = baseName.toLowerCase(Locale.ROOT);
        if (CONFIG_FILE_NAMES.contains(lower)) {
            return true;
        }
        return lower.endsWith(".env.example")
                || lower.endsWith(".yaml")
                || lower.endsWith(".yml")
                || lower.endsWith(".toml")
                || lower.startsWith("dockerfile");
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
