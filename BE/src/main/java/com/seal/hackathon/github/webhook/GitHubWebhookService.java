package com.seal.hackathon.github.webhook;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seal.hackathon.aireview.entity.TeamRepository;
import com.seal.hackathon.aireview.repository.TeamRepositoryEntityRepository;
import com.seal.hackathon.aireview.service.AiReviewAsyncTrigger;
import com.seal.hackathon.github.service.RepoCommitService;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
@RequiredArgsConstructor
public class GitHubWebhookService {

    private final GitHubWebhookSignatureVerifier signatureVerifier;
    private final TeamRepositoryEntityRepository teamRepositoryEntityRepository;
    private final AiReviewAsyncTrigger aiReviewAsyncTrigger;
    private final RepoCommitService repoCommitService;
    private final ObjectMapper objectMapper;

    @Value("${app.github.webhook-secret:}")
    private String webhookSecret;

    @Value("${app.ai.review.webhook-enabled:true}")
    private boolean webhookReviewEnabled;

    @Transactional
    public void handleWebhook(String eventType, String payload, String signatureHeader) {
        if (!signatureVerifier.isValid(payload, signatureHeader, webhookSecret)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "INVALID_GITHUB_WEBHOOK_SIGNATURE");
        }

        if ("ping".equalsIgnoreCase(eventType)) {
            log.info("GitHub webhook ping received");
            return;
        }

        if (!"push".equalsIgnoreCase(eventType)) {
            return;
        }

        JsonNode root;
        try {
            root = objectMapper.readTree(payload);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_GITHUB_WEBHOOK_PAYLOAD");
        }

        JsonNode repository = root.path("repository");
        if (repository.isMissingNode()) {
            return;
        }

        Long githubRepoId = repository.path("id").isNumber() ? repository.path("id").asLong() : null;
        String owner = textOrNull(repository.path("owner").path("login"));
        String repoName = textOrNull(repository.path("name"));
        OffsetDateTime pushedAt = resolvePushTimestamp(root);

        List<TeamRepository> repositories = findMatchingRepositories(githubRepoId, owner, repoName);
        if (repositories.isEmpty()) {
            log.debug("GitHub push ignored — no tracked repository for {}/{}", owner, repoName);
            return;
        }

        OffsetDateTime now = OffsetDateTime.now();
        for (TeamRepository repositoryEntity : repositories) {
            repositoryEntity.setLastPushAt(pushedAt);
            repositoryEntity.setUpdatedAt(now);
            if (webhookReviewEnabled) {
                repositoryEntity.setNextReviewAt(now);
            }
        }
        teamRepositoryEntityRepository.saveAll(repositories);
        for (TeamRepository repositoryEntity : repositories) {
            repoCommitService.captureLatestCommitSilently(repositoryEntity.getId());
        }
        if (webhookReviewEnabled) {
            for (TeamRepository repositoryEntity : repositories) {
                aiReviewAsyncTrigger.scheduleAfterPush(repositoryEntity.getId());
            }
        }
        log.info(
                "Recorded GitHub push at {} for {}/{} ({} repo record(s))",
                pushedAt,
                owner,
                repoName,
                repositories.size());
    }

    private List<TeamRepository> findMatchingRepositories(Long githubRepoId, String owner, String repoName) {
        Set<TeamRepository> matches = new LinkedHashSet<>();
        if (githubRepoId != null) {
            matches.addAll(teamRepositoryEntityRepository.findByGithubRepoId(githubRepoId));
        }
        if (matches.isEmpty() && StringUtils.hasText(owner) && StringUtils.hasText(repoName)) {
            matches.addAll(teamRepositoryEntityRepository
                    .findByGithubOwnerIgnoreCaseAndGithubRepoNameIgnoreCase(owner.trim(), repoName.trim()));
        }
        return new ArrayList<>(matches);
    }

    private OffsetDateTime resolvePushTimestamp(JsonNode root) {
        String headCommitTimestamp = textOrNull(root.path("head_commit").path("timestamp"));
        if (StringUtils.hasText(headCommitTimestamp)) {
            try {
                return OffsetDateTime.parse(headCommitTimestamp);
            } catch (DateTimeParseException ignored) {
                // fall through
            }
        }
        return OffsetDateTime.now();
    }

    private String textOrNull(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }
        String value = node.asText(null);
        return StringUtils.hasText(value) ? value : null;
    }
}
