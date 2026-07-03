package com.seal.hackathon.github.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

@Service
public class PatGitHubRepositoryClient implements GitHubRepositoryClient {

    private final GitHubAuthService githubAuthService;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public PatGitHubRepositoryClient(
            GitHubAuthService githubAuthService,
            @Value("${app.github.api-base-url:https://api.github.com}") String apiBaseUrl,
            @Value("${app.github.api-version:2026-03-10}") String apiVersion,
            RestClient.Builder restClientBuilder,
            ObjectMapper objectMapper) {
        this.githubAuthService = githubAuthService;
        this.objectMapper = objectMapper;
        this.restClient = restClientBuilder
                .baseUrl(stripTrailingSlash(apiBaseUrl))
                .defaultHeader(HttpHeaders.ACCEPT, "application/vnd.github+json")
                .defaultHeader("X-GitHub-Api-Version", normalizeApiVersion(apiVersion))
                .build();
    }

    @Override
    public GitHubRepositoryInfo createRepoFromTemplate(
            String templateOwner,
            String templateRepo,
            String org,
            String newRepoName,
            boolean privateRepo) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("owner", org);
        body.put("name", newRepoName);
        body.put("private", privateRepo);
        body.put("include_all_branches", false);

        try {
            Map<String, Object> response = execute(() -> restClient.post()
                    .uri("/repos/{templateOwner}/{templateRepo}/generate", templateOwner, templateRepo)
                    .headers(this::authorize)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {
                    }));
            return toRepositoryInfo(response);
        } catch (GitHubClientException ex) {
            if (isAlreadyExistsConflict(ex)) {
                return getRepository(org, newRepoName)
                        .orElseThrow(() -> new GitHubClientException(
                                ex.getStatusCode(),
                                ex.getMessage() + "; target repository was not found after create conflict",
                                ex.getResponseBody()));
            }
            throw ex;
        }
    }

    @Override
    public void addCollaborator(String owner, String repo, String username, String permission) {
        updateCollaboratorPermission(owner, repo, username, permission);
    }

    @Override
    public boolean userExists(String username) {
        if (!StringUtils.hasText(username)) {
            return false;
        }
        try {
            Map<String, Object> response = execute(() -> restClient.get()
                    .uri("/users/{username}", username.trim())
                    .headers(this::authorize)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {
                    }));
            return response != null && StringUtils.hasText(asString(response.get("login")));
        } catch (GitHubClientException ex) {
            if (ex.getStatusCode() == 404) {
                return false;
            }
            throw ex;
        }
    }

    @Override
    public void updateCollaboratorPermission(String owner, String repo, String username, String permission) {
        Map<String, Object> body = Map.of("permission", permission);
        execute(() -> restClient.put()
                .uri("/repos/{owner}/{repo}/collaborators/{username}", owner, repo, username)
                .headers(this::authorize)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .toBodilessEntity());
    }

    @Override
    public void protectBranchFromPush(String owner, String repo, String branch) {
        String resolvedBranch = StringUtils.hasText(branch) ? branch.trim() : "main";
        Map<String, Object> pullRequestReviews = new LinkedHashMap<>();
        pullRequestReviews.put("dismiss_stale_reviews", false);
        pullRequestReviews.put("require_code_owner_reviews", false);
        pullRequestReviews.put("required_approving_review_count", 1);
        pullRequestReviews.put("require_last_push_approval", false);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("required_status_checks", null);
        body.put("enforce_admins", true);
        body.put("required_pull_request_reviews", pullRequestReviews);
        body.put("restrictions", null);
        body.put("required_linear_history", false);
        body.put("allow_force_pushes", false);
        body.put("allow_deletions", false);
        body.put("block_creations", false);
        body.put("required_conversation_resolution", false);
        body.put("lock_branch", true);
        body.put("allow_fork_syncing", false);

        execute(() -> restClient.put()
                .uri("/repos/{owner}/{repo}/branches/{branch}/protection", owner, repo, resolvedBranch)
                .headers(this::authorize)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .toBodilessEntity());
    }

    @Override
    public Optional<String> getCollaboratorPermission(String owner, String repo, String username) {
        try {
            Map<String, Object> response = execute(() -> restClient.get()
                    .uri("/repos/{owner}/{repo}/collaborators/{username}/permission", owner, repo, username)
                    .headers(this::authorize)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {
                    }));
            if (response == null) {
                return Optional.empty();
            }
            String permission = asString(response.get("permission"));
            return StringUtils.hasText(permission) ? Optional.of(permission) : Optional.empty();
        } catch (GitHubClientException ex) {
            if (ex.getStatusCode() == 404) {
                return Optional.empty();
            }
            throw ex;
        }
    }

    @Override
    public Optional<GitHubCommitInfo> getLatestCommit(String owner, String repo, String branch) {
        String resolvedBranch = StringUtils.hasText(branch) ? branch.trim() : "main";
        try {
            List<Map<String, Object>> response = execute(() -> restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/repos/{owner}/{repo}/commits")
                            .queryParam("sha", resolvedBranch)
                            .queryParam("per_page", 1)
                            .build(owner, repo))
                    .headers(this::authorize)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {
                    }));
            if (response == null || response.isEmpty()) {
                return Optional.empty();
            }
            return Optional.of(toCommitInfo(response.get(0)));
        } catch (GitHubClientException ex) {
            if (ex.getStatusCode() == 404 || ex.getStatusCode() == 409) {
                return Optional.empty();
            }
            throw ex;
        }
    }

    @Override
    public List<GitHubCommitInfo> listCommitsSince(
            String owner,
            String repo,
            String branch,
            OffsetDateTime since,
            OffsetDateTime until,
            int maxCommits) {
        int cap = Math.min(Math.max(maxCommits, 1), 500);
        List<GitHubCommitInfo> collected = new ArrayList<>();
        int page = 1;
        while (collected.size() < cap) {
            int perPage = Math.min(100, cap - collected.size());
            List<GitHubCommitInfo> batch = fetchCommitsPage(owner, repo, branch, since, until, perPage, page);
            if (batch.isEmpty()) {
                break;
            }
            for (GitHubCommitInfo commit : batch) {
                if (collected.size() >= cap) {
                    break;
                }
                collected.add(commit);
            }
            if (batch.size() < perPage) {
                break;
            }
            page++;
        }
        return collected;
    }

    private List<GitHubCommitInfo> fetchCommitsPage(
            String owner,
            String repo,
            String branch,
            OffsetDateTime since,
            OffsetDateTime until,
            int perPage,
            int page) {
        try {
            List<Map<String, Object>> response = execute(() -> restClient.get()
                    .uri(uriBuilder -> {
                        var builder = uriBuilder
                                .path("/repos/{owner}/{repo}/commits")
                                .queryParam("sha", branch)
                                .queryParam("per_page", perPage)
                                .queryParam("page", page);
                        if (since != null) {
                            builder.queryParam("since", since.toString());
                        }
                        if (until != null) {
                            builder.queryParam("until", until.toString());
                        }
                        return builder.build(owner, repo);
                    })
                    .headers(this::authorize)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {
                    }));
            if (response == null || response.isEmpty()) {
                return List.of();
            }
            return response.stream().map(this::toCommitInfo).toList();
        } catch (GitHubClientException ex) {
            if (ex.getStatusCode() == 404 || ex.getStatusCode() == 409) {
                return List.of();
            }
            throw ex;
        }
    }

    @Override
    public Optional<GitHubCommitDetail> getCommitDetail(String owner, String repo, String sha) {
        try {
            Map<String, Object> response = execute(() -> restClient.get()
                    .uri("/repos/{owner}/{repo}/commits/{sha}", owner, repo, sha)
                    .headers(headers -> {
                        authorize(headers);
                        headers.set("Accept", "application/vnd.github+json");
                    })
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {
                    }));
            return Optional.of(toCommitDetail(response));
        } catch (GitHubClientException ex) {
            if (ex.getStatusCode() == 404) {
                return Optional.empty();
            }
            throw ex;
        }
    }

    @Override
    public void ensurePushWebhook(String owner, String repo, String payloadUrl, String secret) {
        String normalizedUrl = normalizeWebhookUrl(payloadUrl);
        if (!StringUtils.hasText(normalizedUrl) || !StringUtils.hasText(secret)) {
            throw new IllegalArgumentException("Webhook payload URL and secret are required");
        }
        if (hasPushWebhook(owner, repo, normalizedUrl)) {
            return;
        }

        Map<String, Object> config = new LinkedHashMap<>();
        config.put("url", normalizedUrl);
        config.put("content_type", "json");
        config.put("secret", secret.trim());
        config.put("insecure_ssl", "0");

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("name", "web");
        body.put("active", true);
        body.put("events", List.of("push"));
        body.put("config", config);

        execute(() -> restClient.post()
                .uri("/repos/{owner}/{repo}/hooks", owner, repo)
                .headers(this::authorize)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .toBodilessEntity());
    }

    private boolean hasPushWebhook(String owner, String repo, String payloadUrl) {
        List<Map<String, Object>> hooks = execute(() -> restClient.get()
                .uri("/repos/{owner}/{repo}/hooks", owner, repo)
                .headers(this::authorize)
                .retrieve()
                .body(new ParameterizedTypeReference<>() {
                }));
        if (hooks == null || hooks.isEmpty()) {
            return false;
        }
        for (Map<String, Object> hook : hooks) {
            if (!hookEventsIncludePush(hook)) {
                continue;
            }
            String existingUrl = webhookConfigUrl(hook);
            if (urlsMatch(existingUrl, payloadUrl)) {
                return true;
            }
        }
        return false;
    }

    @SuppressWarnings("unchecked")
    private boolean hookEventsIncludePush(Map<String, Object> hook) {
        Object events = hook.get("events");
        if (!(events instanceof List<?> eventList)) {
            return false;
        }
        return eventList.stream().anyMatch(event -> "push".equalsIgnoreCase(String.valueOf(event)));
    }

    @SuppressWarnings("unchecked")
    private String webhookConfigUrl(Map<String, Object> hook) {
        Object config = hook.get("config");
        if (!(config instanceof Map<?, ?> rawConfig)) {
            return null;
        }
        return asString(((Map<String, Object>) rawConfig).get("url"));
    }

    private String normalizeWebhookUrl(String payloadUrl) {
        if (!StringUtils.hasText(payloadUrl)) {
            return null;
        }
        String trimmed = payloadUrl.trim();
        while (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
    }

    private boolean urlsMatch(String left, String right) {
        String normalizedLeft = normalizeWebhookUrl(left);
        String normalizedRight = normalizeWebhookUrl(right);
        if (!StringUtils.hasText(normalizedLeft) || !StringUtils.hasText(normalizedRight)) {
            return false;
        }
        return normalizedLeft.equalsIgnoreCase(normalizedRight);
    }

    @Override
    public GitHubIssueInfo createIssue(String owner, String repo, String title, String bodyMarkdown) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("title", title);
        body.put("body", bodyMarkdown);
        Map<String, Object> response = execute(() -> restClient.post()
                .uri("/repos/{owner}/{repo}/issues", owner, repo)
                .headers(this::authorize)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(new ParameterizedTypeReference<>() {
                }));
        return toIssueInfo(response);
    }

    private GitHubIssueInfo toIssueInfo(Map<String, Object> response) {
        if (response == null) {
            throw new GitHubClientException(502, "GitHub issue response was empty", null);
        }
        Object number = response.get("number");
        Object htmlUrl = response.get("html_url");
        Object title = response.get("title");
        return GitHubIssueInfo.builder()
                .number(number instanceof Number num ? num.longValue() : null)
                .htmlUrl(htmlUrl instanceof String url ? url : null)
                .title(title instanceof String text ? text : null)
                .build();
    }

    @Override
    public Optional<GitHubRepositoryInfo> getRepository(String owner, String repo) {
        try {
            Map<String, Object> response = execute(() -> restClient.get()
                    .uri("/repos/{owner}/{repo}", owner, repo)
                    .headers(this::authorize)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {
                    }));
            return Optional.of(toRepositoryInfo(response));
        } catch (GitHubClientException ex) {
            if (ex.getStatusCode() == 404) {
                return Optional.empty();
            }
            throw ex;
        }
    }

    private void authorize(HttpHeaders headers) {
        headers.setBearerAuth(githubAuthService.getBearerToken());
    }

    private <T> T execute(GitHubCall<T> call) {
        try {
            return call.run();
        } catch (RestClientResponseException ex) {
            String responseBody = sanitizeSecret(ex.getResponseBodyAsString());
            throw new GitHubClientException(
                    ex.getStatusCode().value(),
                    formatGitHubError(ex.getStatusCode().value(), responseBody),
                    responseBody);
        } catch (RestClientException ex) {
            throw new GitHubClientException(503, "GitHub API request failed");
        }
    }

    @SuppressWarnings("unchecked")
    private GitHubCommitInfo toCommitInfo(Map<String, Object> response) {
        if (response == null) {
            throw new GitHubClientException(502, "GitHub API returned an empty commit response");
        }
        Map<String, Object> commit = response.get("commit") instanceof Map<?, ?> rawCommit
                ? (Map<String, Object>) rawCommit
                : Map.of();
        Map<String, Object> author = commit.get("author") instanceof Map<?, ?> rawAuthor
                ? (Map<String, Object>) rawAuthor
                : Map.of();
        return GitHubCommitInfo.builder()
                .sha(asString(response.get("sha")))
                .message(asString(commit.get("message")))
                .authorName(asString(author.get("name")))
                .authorEmail(asString(author.get("email")))
                .committedAt(parseOffsetDateTime(asString(author.get("date"))))
                .htmlUrl(asString(response.get("html_url")))
                .build();
    }

    @SuppressWarnings("unchecked")
    private GitHubCommitDetail toCommitDetail(Map<String, Object> response) {
        if (response == null) {
            throw new GitHubClientException(502, "GitHub API returned an empty commit response");
        }
        Map<String, Object> commit = response.get("commit") instanceof Map<?, ?> rawCommit
                ? (Map<String, Object>) rawCommit
                : Map.of();
        Map<String, Object> author = commit.get("author") instanceof Map<?, ?> rawAuthor
                ? (Map<String, Object>) rawAuthor
                : Map.of();
        Map<String, Object> stats = response.get("stats") instanceof Map<?, ?> rawStats
                ? (Map<String, Object>) rawStats
                : Map.of();

        List<GitHubCommitDetail.GitHubCommitFileChange> files = new ArrayList<>();
        Object rawFiles = response.get("files");
        if (rawFiles instanceof List<?> fileList) {
            for (Object item : fileList) {
                if (!(item instanceof Map<?, ?> rawFile)) {
                    continue;
                }
                Map<String, Object> file = (Map<String, Object>) rawFile;
                files.add(GitHubCommitDetail.GitHubCommitFileChange.builder()
                        .filename(asString(file.get("filename")))
                        .status(asString(file.get("status")))
                        .additions(asInt(file.get("additions")))
                        .deletions(asInt(file.get("deletions")))
                        .patch(asString(file.get("patch")))
                        .build());
            }
        }

        return GitHubCommitDetail.builder()
                .sha(asString(response.get("sha")))
                .message(asString(commit.get("message")))
                .authorName(asString(author.get("name")))
                .authorEmail(asString(author.get("email")))
                .committedAt(parseOffsetDateTime(asString(author.get("date"))))
                .htmlUrl(asString(response.get("html_url")))
                .additions(asInt(stats.get("additions")))
                .deletions(asInt(stats.get("deletions")))
                .files(files)
                .build();
    }

    private int asInt(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        return 0;
    }

    private OffsetDateTime parseOffsetDateTime(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        try {
            return OffsetDateTime.parse(value.trim());
        } catch (Exception ex) {
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private GitHubRepositoryInfo toRepositoryInfo(Map<String, Object> response) {
        if (response == null) {
            throw new GitHubClientException(502, "GitHub API returned an empty repository response");
        }
        Map<String, Object> owner = response.get("owner") instanceof Map<?, ?> rawOwner
                ? (Map<String, Object>) rawOwner
                : Map.of();
        return GitHubRepositoryInfo.builder()
                .id(asLong(response.get("id")))
                .owner(asString(owner.get("login")))
                .name(asString(response.get("name")))
                .htmlUrl(asString(response.get("html_url")))
                .defaultBranch(asString(response.get("default_branch")))
                .build();
    }

    private Long asLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        return null;
    }

    private String asString(Object value) {
        return value == null ? null : value.toString();
    }

    private String stripTrailingSlash(String value) {
        if (!StringUtils.hasText(value)) {
            return "https://api.github.com";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private String normalizeApiVersion(String value) {
        return StringUtils.hasText(value) ? value.trim() : "2026-03-10";
    }

    private boolean isAlreadyExistsConflict(GitHubClientException ex) {
        if (ex.getStatusCode() != 422) {
            return false;
        }
        String value = ((ex.getResponseBody() == null ? "" : ex.getResponseBody())
                + " "
                + (ex.getMessage() == null ? "" : ex.getMessage()))
                .toLowerCase();
        return value.contains("already_exists")
                || value.contains("already exists")
                || value.contains("name already");
    }

    private String formatGitHubError(int statusCode, String responseBody) {
        StringBuilder message = new StringBuilder("GitHub API request failed with status ")
                .append(statusCode);
        if (!StringUtils.hasText(responseBody)) {
            return message.toString();
        }
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            appendJsonText(message, root.path("message"));
            JsonNode errors = root.path("errors");
            if (errors.isArray()) {
                for (JsonNode error : errors) {
                    appendErrorNode(message, error);
                }
            }
        } catch (Exception ex) {
            message.append(": ").append(responseBody);
        }
        return truncate(sanitizeSecret(message.toString()));
    }

    private void appendJsonText(StringBuilder message, JsonNode node) {
        if (node.isTextual() && StringUtils.hasText(node.asText())) {
            message.append(": ").append(node.asText().trim());
        }
    }

    private void appendErrorNode(StringBuilder message, JsonNode error) {
        if (!error.isObject()) {
            appendJsonText(message, error);
            return;
        }
        String resource = textOrBlank(error.path("resource"));
        String field = textOrBlank(error.path("field"));
        String code = textOrBlank(error.path("code"));
        String errorMessage = textOrBlank(error.path("message"));
        String detail = String.join(" ", resource, field, code, errorMessage).trim();
        if (StringUtils.hasText(detail)) {
            message.append("; ").append(detail.replaceAll("\\s+", " "));
        }
    }

    private String textOrBlank(JsonNode node) {
        return node.isTextual() ? node.asText().trim() : "";
    }

    private String sanitizeSecret(String value) {
        if (!StringUtils.hasText(value)) {
            return value;
        }
        return value
                .replaceAll("(?i)(authorization\\s*[:=]\\s*bearer\\s+)\\S+", "$1[redacted]")
                .replaceAll("(?i)(token|bearer|pat|private[_ -]?key)\\s*[:=]\\s*\\S+", "$1=[redacted]");
    }

    private String truncate(String value) {
        return value.length() > 500 ? value.substring(0, 500) : value;
    }

    @FunctionalInterface
    private interface GitHubCall<T> {
        T run();
    }
}
