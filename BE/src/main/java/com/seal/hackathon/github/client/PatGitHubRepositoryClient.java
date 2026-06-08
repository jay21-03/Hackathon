package com.seal.hackathon.github.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.LinkedHashMap;
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

    private final String mode;
    private final String pat;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public PatGitHubRepositoryClient(
            @Value("${app.github.mode:pat}") String mode,
            @Value("${app.github.pat:}") String pat,
            @Value("${app.github.api-base-url:https://api.github.com}") String apiBaseUrl,
            @Value("${app.github.api-version:2026-03-10}") String apiVersion,
            RestClient.Builder restClientBuilder,
            ObjectMapper objectMapper) {
        this.mode = mode == null ? "pat" : mode.trim().toLowerCase();
        this.pat = pat;
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
        ensurePatModeConfigured();
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
    public void updateCollaboratorPermission(String owner, String repo, String username, String permission) {
        ensurePatModeConfigured();
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
    public Optional<GitHubRepositoryInfo> getRepository(String owner, String repo) {
        ensurePatModeConfigured();
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

    private void ensurePatModeConfigured() {
        if (!"pat".equals(mode)) {
            throw new GitHubClientException(503, "GitHub App mode is configured but not implemented in this MVP");
        }
        if (!StringUtils.hasText(pat)) {
            throw new GitHubClientException(503, "GitHub PAT is not configured");
        }
    }

    private void authorize(HttpHeaders headers) {
        headers.setBearerAuth(pat);
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
