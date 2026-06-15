package com.seal.hackathon.aireview.service;



import com.fasterxml.jackson.databind.JsonNode;

import com.fasterxml.jackson.databind.ObjectMapper;

import com.fasterxml.jackson.databind.node.ArrayNode;

import com.fasterxml.jackson.databind.node.ObjectNode;

import com.seal.hackathon.aireview.client.AiReviewLlmClient;

import com.seal.hackathon.aireview.dto.AiReviewResponse;

import com.seal.hackathon.aireview.dto.BulkAiReviewFailure;

import com.seal.hackathon.aireview.dto.BulkAiReviewResponse;

import com.seal.hackathon.aireview.entity.AiReview;

import com.seal.hackathon.aireview.entity.RepoCommit;

import com.seal.hackathon.aireview.entity.TeamRepository;

import com.seal.hackathon.aireview.repository.AiReviewRepository;

import com.seal.hackathon.aireview.repository.RepoCommitRepository;

import com.seal.hackathon.aireview.repository.TeamRepositoryEntityRepository;

import com.seal.hackathon.aireview.support.AiReviewDiffBuilder;

import com.seal.hackathon.aireview.support.AiReviewIssueFormatter;

import com.seal.hackathon.aireview.support.AiReviewPrompts;

import com.seal.hackathon.common.enums.AiReviewKind;

import com.seal.hackathon.common.enums.AiReviewStatus;

import com.seal.hackathon.common.enums.RepositoryProvisionStatus;

import com.seal.hackathon.common.util.GitHubRepoCoordinates;

import com.seal.hackathon.contest.entity.BoardSlot;

import com.seal.hackathon.contest.repository.BoardSlotRepository;

import com.seal.hackathon.github.client.GitHubClientException;

import com.seal.hackathon.github.client.GitHubCommitDetail;

import com.seal.hackathon.github.client.GitHubCommitInfo;

import com.seal.hackathon.github.client.GitHubIssueInfo;

import com.seal.hackathon.github.client.GitHubRepositoryClient;

import com.seal.hackathon.github.entity.ProblemRepositoryTemplate;

import com.seal.hackathon.github.repository.ProblemRepositoryTemplateRepository;

import com.seal.hackathon.registration.entity.Team;

import com.seal.hackathon.common.security.OrganizerAuthorizationService;

import java.math.BigDecimal;

import java.time.OffsetDateTime;

import java.util.ArrayList;

import java.util.Comparator;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

import java.util.List;

import java.util.Map;

import java.util.Optional;

import java.util.Set;

import lombok.RequiredArgsConstructor;

import org.slf4j.Logger;

import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Value;

import org.springframework.data.domain.PageRequest;

import org.springframework.http.HttpStatus;

import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

import org.springframework.util.StringUtils;

import org.springframework.web.server.ResponseStatusException;



@Service

@RequiredArgsConstructor

public class AiReviewService {



    private static final Logger log = LoggerFactory.getLogger(AiReviewService.class);

    private static final int MAX_COMMITS_FOR_AGGREGATE = 200;

    private static final int MAX_PRIOR_PUSH_REVIEWS = 40;



    private final AiReviewRepository aiReviewRepository;

    private final TeamRepositoryEntityRepository teamRepositoryEntityRepository;

    private final RepoCommitRepository repoCommitRepository;

    private final com.seal.hackathon.registration.repository.TeamRepository registrationTeamRepository;

    private final BoardSlotRepository boardSlotRepository;

    private final GitHubRepositoryClient githubRepositoryClient;

    private final ProblemRepositoryTemplateRepository templateRepository;

    private final AiReviewLlmClient aiReviewLlmClient;

    private final AiReviewAccessService aiReviewAccessService;

    private final OrganizerAuthorizationService organizerAuthorizationService;

    private final ObjectMapper objectMapper;

    private final AiReviewNotificationPublisher notificationPublisher;

    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private AiReviewTeamRunner aiReviewTeamRunner;



    @Value("${app.github.default-branch:main}")

    private String configuredDefaultBranch;



    @Value("${app.ai.review.interval-minutes:30}")

    private int defaultIntervalMinutes;



    @Value("${app.ai.review.model:gemini-2.0-flash}")

    private String aiModel;



    @Value("${app.ai.review.github-issues-enabled:true}")

    private boolean githubIssuesEnabled;

    @Value("${app.ai.review.manual-cooldown-seconds:30}")

    private int manualCooldownSeconds;

    private final ConcurrentHashMap<Long, Instant> manualReviewCooldown = new ConcurrentHashMap<>();

    public boolean isConfigured() {

        return aiReviewLlmClient.isConfigured();

    }

    private void enforceManualCooldown(Long teamId) {

        Instant last = manualReviewCooldown.get(teamId);

        if (last != null && Instant.now().isBefore(last.plusSeconds(Math.max(manualCooldownSeconds, 0)))) {

            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "AI_REVIEW_COOLDOWN");

        }

        manualReviewCooldown.put(teamId, Instant.now());

    }



    @Transactional(readOnly = true)

    public List<AiReviewResponse> listTeamReviews(Long teamId) {

        aiReviewAccessService.requireCanViewTeamReviews(teamId);

        Team team = loadTeam(teamId);

        return aiReviewRepository.findByTeamIdOrderByReviewedAtDescCreatedAtDesc(teamId).stream()

                .map(review -> toResponse(review, team.getName(), null))

                .toList();

    }



    @Transactional(readOnly = true)

    public AiReviewResponse getLatestTeamReview(Long teamId) {

        aiReviewAccessService.requireCanViewTeamReviews(teamId);

        Team team = loadTeam(teamId);

        Optional<AiReview> aggregate = aiReviewRepository

                .findFirstByTeamIdAndReviewKindOrderByReviewedAtDescCreatedAtDesc(teamId, AiReviewKind.TEAM_AGGREGATE);

        if (aggregate.isPresent()) {

            return toResponse(aggregate.get(), team.getName(), null);

        }

        return aiReviewRepository

                .findFirstByTeamIdAndReviewKindOrderByReviewedAtDescCreatedAtDesc(teamId, AiReviewKind.PER_PUSH)

                .map(review -> toResponse(review, team.getName(), null))

                .orElse(null);

    }



    @Transactional(readOnly = true)

    public List<AiReviewResponse> listEventReviews(Long eventId) {

        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);

        List<Long> teamIds = registrationTeamRepository.findByEventIdOrderByNameAscIdAsc(eventId).stream()

                .map(Team::getId)

                .toList();

        if (teamIds.isEmpty()) {

            return List.of();

        }

        Map<Long, String> teamNames = new LinkedHashMap<>();

        for (Team team : registrationTeamRepository.findAllById(teamIds)) {

            teamNames.put(team.getId(), team.getName());

        }

        Map<Long, AiReview> latestByTeam = new LinkedHashMap<>();

        for (AiReview review : aiReviewRepository.findByTeamIdInAndReviewKindOrderByReviewedAtDescCreatedAtDesc(

                teamIds, AiReviewKind.TEAM_AGGREGATE)) {

            latestByTeam.putIfAbsent(review.getTeamId(), review);

        }

        for (Long teamId : teamIds) {

            if (!latestByTeam.containsKey(teamId)) {

                aiReviewRepository

                        .findFirstByTeamIdAndReviewKindOrderByReviewedAtDescCreatedAtDesc(teamId, AiReviewKind.PER_PUSH)

                        .ifPresent(review -> latestByTeam.put(teamId, review));

            }

        }

        Set<Long> teamsWithReviewableRepo = teamRepositoryEntityRepository.findByTeamIdIn(teamIds).stream()

                .filter(this::isReviewableRepository)

                .map(TeamRepository::getTeamId)

                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));

        return teamIds.stream()

                .filter(teamId -> teamsWithReviewableRepo.contains(teamId) || latestByTeam.containsKey(teamId))

                .map(teamId -> {

                    AiReview review = latestByTeam.get(teamId);

                    if (review != null) {

                        return toResponse(review, teamNames.get(teamId), null);

                    }

                    return AiReviewResponse.builder()

                            .teamId(teamId)

                            .teamName(teamNames.get(teamId))

                            .status(AiReviewStatus.PENDING)

                            .build();

                })

                .toList();

    }



    @Transactional

    public BulkAiReviewResponse triggerEventReviews(Long eventId) {

        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);

        if (!aiReviewLlmClient.isConfigured()) {

            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "AI_REVIEW_NOT_CONFIGURED");

        }

        List<Team> teams = registrationTeamRepository.findByEventIdOrderByNameAscIdAsc(eventId);

        List<AiReviewResponse> succeeded = new ArrayList<>();

        List<BulkAiReviewFailure> failed = new ArrayList<>();

        for (Team team : teams) {

            try {

                succeeded.add(aiReviewTeamRunner.runForTeam(team.getId()));

            } catch (ResponseStatusException ex) {

                failed.add(BulkAiReviewFailure.builder()

                        .teamId(team.getId())

                        .teamName(team.getName())

                        .reason(ex.getReason())

                        .build());

            } catch (RuntimeException ex) {

                failed.add(BulkAiReviewFailure.builder()

                        .teamId(team.getId())

                        .teamName(team.getName())

                        .reason(ex.getMessage())

                        .build());

            }

        }

        return BulkAiReviewResponse.builder()

                .total(teams.size())

                .succeededCount(succeeded.size())

                .failedCount(failed.size())

                .succeeded(succeeded)

                .failed(failed)

                .build();

    }



    @Transactional

    public int runDueReviews() {

        if (!aiReviewLlmClient.isConfigured()) {

            log.debug("AI review skipped — API key not configured");

            return 0;

        }

        OffsetDateTime now = OffsetDateTime.now();

        List<TeamRepository> due = teamRepositoryEntityRepository.findDueForAiReview(

                now, RepositoryProvisionStatus.CREATED);

        int completed = 0;

        for (TeamRepository repository : due) {

            try {

                if (reviewRepository(repository, false) != null) {

                    completed++;

                }

            } catch (Exception ex) {

                log.warn("AI review failed for team repository {}: {}", repository.getId(), ex.getMessage());

            }

        }

        return completed;

    }



    @Transactional

    public AiReviewResponse triggerTeamReview(Long teamId) {

        Team team = loadTeam(teamId);

        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(team.getEventId());

        enforceManualCooldown(teamId);

        return triggerTeamReviewInternal(teamId);

    }

    @Transactional

    public AiReviewResponse triggerTeamReviewInternal(Long teamId) {

        Team team = loadTeam(teamId);

        TeamRepository repository = teamRepositoryEntityRepository.findAllByTeamId(teamId).stream()

                .filter(item -> item.getProvisionStatus() == RepositoryProvisionStatus.CREATED)

                .filter(item -> StringUtils.hasText(item.getGithubOwner()) && StringUtils.hasText(item.getGithubRepoName()))

                .max(Comparator.comparing(TeamRepository::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())))

                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "NO_REVIEWABLE_REPOSITORY"));

        if (!aiReviewLlmClient.isConfigured()) {

            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "AI_REVIEW_NOT_CONFIGURED");

        }

        AiReview review = reviewRepository(repository, true);

        if (review == null) {

            throw new ResponseStatusException(HttpStatus.CONFLICT, "NO_COMMITS_TO_REVIEW");

        }

        return toResponse(review, team.getName(), review.getCommitSha());

    }

    @Transactional
    public void triggerReviewForRepository(Long teamRepositoryId) {
        if (!aiReviewLlmClient.isConfigured()) {
            log.debug("AI review on push skipped — API key not configured");
            return;
        }
        TeamRepository repository = teamRepositoryEntityRepository.findById(teamRepositoryId).orElse(null);
        if (repository == null || repository.getProvisionStatus() != RepositoryProvisionStatus.CREATED) {
            return;
        }
        if (!StringUtils.hasText(repository.getGithubOwner()) || !StringUtils.hasText(repository.getGithubRepoName())) {
            return;
        }
        try {
            reviewRepository(repository, true);
        } catch (Exception ex) {
            log.warn("AI review on push failed for repository {}: {}", teamRepositoryId, ex.getMessage());
        }
    }

    private AiReview reviewRepository(TeamRepository repository, boolean force) {

        GitHubRepoCoordinates coordinates = GitHubRepoCoordinates.fromTeamRepository(

                        repository.getGithubOwner(), repository.getGithubRepoName(), repository.getRepositoryUrl())

                .orElse(null);

        if (coordinates == null) {

            scheduleNext(repository, OffsetDateTime.now(), false);

            return null;

        }



        String branch = resolveBranch(repository.getProblemId());

        OffsetDateTime since = repository.getLastReviewedAt();

        if (since == null && !force) {

            since = OffsetDateTime.now().minusHours(1);

        }

        if (force && since == null) {

            since = OffsetDateTime.now().minusDays(7);

        }



        List<GitHubCommitInfo> commitInfos;

        try {

            commitInfos = githubRepositoryClient.listCommitsSince(

                    coordinates.owner(), coordinates.repoName(), branch, since, 20);

        } catch (GitHubClientException ex) {

            scheduleNext(repository, OffsetDateTime.now(), false);

            throw ex;

        }



        if (commitInfos.isEmpty() && !force) {

            scheduleNext(repository, OffsetDateTime.now(), false);

            return null;

        }

        if (commitInfos.isEmpty()) {

            commitInfos = githubRepositoryClient

                    .getLatestCommit(coordinates.owner(), coordinates.repoName(), branch)

                    .stream()

                    .toList();

        }

        if (commitInfos.isEmpty()) {

            scheduleNext(repository, OffsetDateTime.now(), false);

            return null;

        }



        List<GitHubCommitDetail> details = new ArrayList<>();

        RepoCommit latestSavedCommit = null;

        for (GitHubCommitInfo info : commitInfos) {

            Optional<GitHubCommitDetail> detail = githubRepositoryClient.getCommitDetail(

                    coordinates.owner(), coordinates.repoName(), info.getSha());

            if (detail.isEmpty()) {

                continue;

            }

            details.add(detail.get());

            latestSavedCommit = upsertRepoCommit(repository, detail.get(), branch);

        }

        if (details.isEmpty() || latestSavedCommit == null) {

            scheduleNext(repository, OffsetDateTime.now(), false);

            return null;

        }



        Team team = loadTeam(repository.getTeamId());

        String repoLabel = coordinates.owner() + "/" + coordinates.repoName();

        OffsetDateTime now = OffsetDateTime.now();



        AiReview perPush = runPerPushReview(repository, team, repoLabel, details, latestSavedCommit, now);

        if (perPush == null || perPush.getStatus() != AiReviewStatus.COMPLETED) {

            scheduleNext(repository, now, false);

            if (perPush != null) {

                notificationPublisher.publishAfterReview(team, perPush, false);

            }

            return perPush;

        }



        JsonNode perPushRoot;

        try {

            perPushRoot = objectMapper.readTree(perPush.getStructuredOutput());

        } catch (Exception ex) {

            log.warn("Could not parse per-push JSON for team {}: {}", team.getId(), ex.getMessage());

            scheduleNext(repository, now, true);

            return perPush;

        }



        boolean significantChange = maybeCreateGitHubIssue(coordinates, team, repoLabel, perPush, perPushRoot);



        AiReview aggregate = runTeamAggregateReview(repository, team, repoLabel, perPush, perPushRoot, latestSavedCommit, now);

        scheduleNext(repository, now, true);

        AiReview finalReview = aggregate != null ? aggregate : perPush;

        notificationPublisher.publishAfterReview(team, finalReview, significantChange);

        return finalReview;

    }



    private AiReview runPerPushReview(

            TeamRepository repository,

            Team team,

            String repoLabel,

            List<GitHubCommitDetail> details,

            RepoCommit latestSavedCommit,

            OffsetDateTime now) {

        String activityLog = AiReviewDiffBuilder.buildActivityLog(details);

        String codeChanges = AiReviewDiffBuilder.buildCodeChangesDetail(details);

        String prompt = AiReviewPrompts.perPushPrompt(team.getName(), repoLabel, activityLog, codeChanges);



        AiReview pending = AiReview.builder()

                .teamId(repository.getTeamId())

                .roundId(repository.getRoundId())

                .repoCommitId(latestSavedCommit.getId())

                .commitSha(latestSavedCommit.getCommitSha())

                .reviewKind(AiReviewKind.PER_PUSH)

                .status(AiReviewStatus.PENDING)

                .aiModel(aiModel)

                .createdAt(now)

                .build();

        pending = aiReviewRepository.save(pending);



        try {

            String json = aiReviewLlmClient.analyzeCodeDiff(prompt);

            JsonNode root = objectMapper.readTree(json);

            pending.setStatus(AiReviewStatus.COMPLETED);

            pending.setStructuredOutput(json);

            pending.setSummary(textAt(root, "overall_picture", "push_summary"));

            if (!StringUtils.hasText(pending.getSummary())) {

                pending.setSummary(textAt(root, "overall_picture", "project_about"));

            }

            pending.setRagLevel(textAt(root, "rag_maturity", "level"));

            pending.setReviewScore(parseScore(root.path("reference_score")));

            pending.setIssues(buildIssuesJson(root));

            pending.setSuggestions(buildSuggestionsJson(root));

            pending.setReviewedAt(now);

            return aiReviewRepository.save(pending);

        } catch (Exception ex) {

            pending.setStatus(AiReviewStatus.FAILED);

            pending.setSummary("AI review failed: " + ex.getMessage());

            pending.setReviewedAt(now);

            aiReviewRepository.save(pending);

            log.warn("Per-push AI review failed for team {}: {}", team.getId(), ex.getMessage());

            return pending;

        }

    }



    private boolean maybeCreateGitHubIssue(

            GitHubRepoCoordinates coordinates,

            Team team,

            String repoLabel,

            AiReview perPush,

            JsonNode perPushRoot) {

        if (!githubIssuesEnabled) {

            return false;

        }

        JsonNode significant = perPushRoot.path("overall_picture").path("significant_change");

        if (!significant.isBoolean() || !significant.asBoolean()) {

            return false;

        }

        if (StringUtils.hasText(perPush.getGithubIssueUrl())) {

            return true;

        }

        try {

            String sha = perPush.getCommitSha();

            String shaShort = sha != null && sha.length() > 7 ? sha.substring(0, 7) : "latest";

            String title = AiReviewIssueFormatter.buildTitle(team.getName(), shaShort);

            String body = AiReviewIssueFormatter.buildBody(team.getName(), repoLabel, perPushRoot, perPush);

            GitHubIssueInfo issue = githubRepositoryClient.createIssue(

                    coordinates.owner(), coordinates.repoName(), title, body);

            if (issue != null && StringUtils.hasText(issue.getHtmlUrl())) {

                perPush.setGithubIssueUrl(issue.getHtmlUrl());

                aiReviewRepository.save(perPush);

                log.info("Created GitHub issue for team {}: {}", team.getId(), issue.getHtmlUrl());

                return true;

            }

        } catch (Exception ex) {

            log.warn("Failed to create GitHub issue for team {}: {}", team.getId(), ex.getMessage());

        }

        return true;

    }



    private AiReview runTeamAggregateReview(

            TeamRepository repository,

            Team team,

            String repoLabel,

            AiReview perPush,

            JsonNode perPushRoot,

            RepoCommit latestSavedCommit,

            OffsetDateTime now) {

        try {

            String commitHistoryJson = buildCommitHistoryJson(repository.getTeamId());

            String priorReviewsJson = buildPriorPushReviewsJson(repository.getTeamId(), perPush.getId());

            String currentPushJson = perPush.getStructuredOutput();

            String prompt = AiReviewPrompts.teamAggregatePrompt(

                    team.getName(), repoLabel, commitHistoryJson, priorReviewsJson, currentPushJson);



            AiReview pending = AiReview.builder()

                    .teamId(repository.getTeamId())

                    .roundId(repository.getRoundId())

                    .repoCommitId(latestSavedCommit.getId())

                    .commitSha(latestSavedCommit.getCommitSha())

                    .reviewKind(AiReviewKind.TEAM_AGGREGATE)

                    .status(AiReviewStatus.PENDING)

                    .aiModel(aiModel)

                    .createdAt(now)

                    .build();

            pending = aiReviewRepository.save(pending);



            String json = aiReviewLlmClient.analyzeCodeDiff(prompt);

            JsonNode root = objectMapper.readTree(json);

            pending.setStatus(AiReviewStatus.COMPLETED);

            pending.setStructuredOutput(json);

            pending.setSummary(firstNonBlank(

                    textAt(root, "overall_picture", "historical_synthesis"),

                    textAt(root, "overall_picture", "push_summary"),

                    textAt(root, "overall_picture", "project_about"),

                    textAt(root, "smb_scale_advisory", "summary")));

            pending.setRagLevel(textAt(root, "rag_maturity", "level"));

            if (!StringUtils.hasText(pending.getRagLevel())) {

                pending.setRagLevel(textAt(perPushRoot, "rag_maturity", "level"));

            }

            pending.setReviewScore(parseScore(root.path("reference_score")));

            pending.setIssues(buildAggregateIssuesJson(root));

            pending.setSuggestions(buildAggregateSuggestionsJson(root, perPushRoot));

            pending.setReviewedAt(now);

            return aiReviewRepository.save(pending);

        } catch (Exception ex) {

            log.warn("Team aggregate AI review failed for team {}: {}", team.getId(), ex.getMessage());

            AiReview failed = AiReview.builder()

                    .teamId(repository.getTeamId())

                    .roundId(repository.getRoundId())

                    .repoCommitId(latestSavedCommit.getId())

                    .commitSha(latestSavedCommit.getCommitSha())

                    .reviewKind(AiReviewKind.TEAM_AGGREGATE)

                    .status(AiReviewStatus.FAILED)

                    .summary("Aggregate review failed: " + ex.getMessage())

                    .aiModel(aiModel)

                    .reviewedAt(now)

                    .createdAt(now)

                    .build();

            return aiReviewRepository.save(failed);

        }

    }



    private String buildCommitHistoryJson(Long teamId) throws Exception {

        List<Long> repoIds = teamRepositoryEntityRepository.findAllByTeamId(teamId).stream()

                .map(TeamRepository::getId)

                .toList();

        if (repoIds.isEmpty()) {

            return "[]";

        }

        List<RepoCommit> commits = repoCommitRepository.findByTeamRepositoryIdInOrderByCommittedAtDescIdDesc(

                repoIds, PageRequest.of(0, MAX_COMMITS_FOR_AGGREGATE));

        ArrayNode array = objectMapper.createArrayNode();

        for (RepoCommit commit : commits) {

            ObjectNode node = objectMapper.createObjectNode();

            node.put("sha", commit.getCommitSha());

            node.put("author", commit.getAuthorName());

            node.put("message", truncate(commit.getMessage(), 500));

            if (commit.getCommittedAt() != null) {

                node.put("committed_at", commit.getCommittedAt().toString());

            }

            array.add(node);

        }

        return objectMapper.writeValueAsString(array);

    }



    private String buildPriorPushReviewsJson(Long teamId, Long excludeReviewId) throws Exception {

        List<AiReview> prior = aiReviewRepository.findByTeamIdAndReviewKindOrderByReviewedAtDescCreatedAtDesc(

                teamId, AiReviewKind.PER_PUSH, PageRequest.of(0, MAX_PRIOR_PUSH_REVIEWS));

        ArrayNode array = objectMapper.createArrayNode();

        for (AiReview review : prior) {

            if (review.getId().equals(excludeReviewId) || review.getStatus() != AiReviewStatus.COMPLETED) {

                continue;

            }

            ObjectNode node = objectMapper.createObjectNode();

            node.put("commit_sha", review.getCommitSha());

            node.put("summary", review.getSummary());

            node.put("rag_level", review.getRagLevel());

            if (StringUtils.hasText(review.getStructuredOutput())) {

                try {

                    node.set("structured", objectMapper.readTree(review.getStructuredOutput()));

                } catch (Exception ignored) {

                    node.put("structured_raw", truncate(review.getStructuredOutput(), 2000));

                }

            }

            array.add(node);

        }

        return objectMapper.writeValueAsString(array);

    }



    private RepoCommit upsertRepoCommit(TeamRepository repository, GitHubCommitDetail detail, String branch) {

        Optional<RepoCommit> existing =

                repoCommitRepository.findByTeamRepositoryIdAndCommitSha(repository.getId(), detail.getSha());

        if (existing.isPresent()) {

            return existing.get();

        }

        OffsetDateTime now = OffsetDateTime.now();

        return repoCommitRepository.save(RepoCommit.builder()

                .teamRepositoryId(repository.getId())

                .commitSha(detail.getSha())

                .authorName(detail.getAuthorName())

                .authorEmail(detail.getAuthorEmail())

                .message(trimMessage(detail.getMessage()))

                .committedAt(detail.getCommittedAt())

                .branch(branch)

                .commitUrl(detail.getHtmlUrl())

                .createdAt(now)

                .build());

    }



    private void scheduleNext(TeamRepository repository, OffsetDateTime now, boolean success) {

        int interval = repository.getReviewIntervalMinutes() != null && repository.getReviewIntervalMinutes() > 0

                ? repository.getReviewIntervalMinutes()

                : defaultIntervalMinutes;

        repository.setReviewIntervalMinutes(interval);

        if (success) {

            repository.setLastReviewedAt(now);

        }

        repository.setNextReviewAt(now.plusMinutes(interval));

        repository.setUpdatedAt(now);

        teamRepositoryEntityRepository.save(repository);

    }



    private Team loadTeam(Long teamId) {

        return registrationTeamRepository.findById(teamId)

                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found"));

    }



    private String resolveBranch(Long problemId) {

        if (problemId != null) {

            Optional<String> templateBranch = templateRepository

                    .findByProblemId(problemId)

                    .map(ProblemRepositoryTemplate::getDefaultBranch)

                    .filter(StringUtils::hasText);

            if (templateBranch.isPresent()) {

                return templateBranch.get().trim();

            }

        }

        return StringUtils.hasText(configuredDefaultBranch) ? configuredDefaultBranch.trim() : "main";

    }



    private BigDecimal parseScore(JsonNode node) {

        if (node == null || node.isMissingNode() || !node.isNumber()) {

            return null;

        }

        return BigDecimal.valueOf(node.asDouble());

    }



    private String textAt(JsonNode root, String objectField, String textField) {

        JsonNode value = root.path(objectField).path(textField);

        return value.isTextual() ? value.asText() : null;

    }



    private String firstNonBlank(String... values) {

        for (String value : values) {

            if (StringUtils.hasText(value)) {

                return value;

            }

        }

        return null;

    }



    private String buildIssuesJson(JsonNode root) throws Exception {

        List<String> issues = new ArrayList<>();

        String security = textAt(root, "assessment", "security");

        if (StringUtils.hasText(security)) {

            issues.add(security);

        }

        String disadvantages = textAt(root, "assessment", "disadvantages");

        if (StringUtils.hasText(disadvantages)) {

            issues.add(disadvantages);

        }

        return objectMapper.writeValueAsString(issues);

    }



    private String buildSuggestionsJson(JsonNode root) throws Exception {

        List<String> suggestions = new ArrayList<>();

        appendTextArray(suggestions, root.path("suggested_test_cases"));

        appendTextArray(suggestions, root.path("suggested_questions_for_team"));

        String improvements = textAt(root, "assessment", "improvement_areas");

        if (StringUtils.hasText(improvements)) {

            suggestions.add(improvements);

        }

        return objectMapper.writeValueAsString(suggestions);

    }



    private String buildAggregateIssuesJson(JsonNode root) throws Exception {

        List<String> issues = new ArrayList<>();

        String security = textAt(root, "assessment", "security");

        if (StringUtils.hasText(security)) {

            issues.add(security);

        }

        String disadvantages = textAt(root, "assessment", "disadvantages");

        if (StringUtils.hasText(disadvantages)) {

            issues.add(disadvantages);

        }

        JsonNode criteria = root.path("criteria_comments");

        if (criteria.isObject()) {

            criteria.fields().forEachRemaining(entry -> {

                if (entry.getValue().isTextual() && StringUtils.hasText(entry.getValue().asText())) {

                    issues.add(entry.getKey() + ": " + entry.getValue().asText());

                }

            });

        }

        return objectMapper.writeValueAsString(issues);

    }



    private String buildAggregateSuggestionsJson(JsonNode root, JsonNode perPushRoot) throws Exception {

        List<String> suggestions = new ArrayList<>();

        appendTextArray(suggestions, root.path("suggested_questions_for_team"));

        if (suggestions.isEmpty()) {

            appendTextArray(suggestions, perPushRoot.path("suggested_questions_for_team"));

        }

        JsonNode advisory = root.path("smb_scale_advisory");

        if (advisory.isObject()) {

            advisory.fields().forEachRemaining(entry -> {

                if (entry.getValue().isTextual() && StringUtils.hasText(entry.getValue().asText())) {

                    suggestions.add(entry.getKey() + ": " + entry.getValue().asText());

                }

            });

        }

        return objectMapper.writeValueAsString(suggestions);

    }



    private void appendTextArray(List<String> target, JsonNode arrayNode) {

        if (!arrayNode.isArray()) {

            return;

        }

        arrayNode.forEach(node -> {

            if (node.isTextual() && StringUtils.hasText(node.asText())) {

                target.add(node.asText());

            }

        });

    }



    private String trimMessage(String message) {

        return truncate(message, 4000);

    }



    private String truncate(String value, int maxLen) {

        if (!StringUtils.hasText(value)) {

            return value;

        }

        String trimmed = value.trim();

        return trimmed.length() > maxLen ? trimmed.substring(0, maxLen) : trimmed;

    }



    private String latestCommitSha(Long repoCommitId) {

        if (repoCommitId == null) {

            return null;

        }

        return repoCommitRepository.findById(repoCommitId).map(RepoCommit::getCommitSha).orElse(null);

    }



    private AiReviewResponse toResponse(AiReview review, String teamName, String commitShaOverride) {

        String commitSha = commitShaOverride != null

                ? commitShaOverride

                : (StringUtils.hasText(review.getCommitSha())

                        ? review.getCommitSha()

                        : latestCommitSha(review.getRepoCommitId()));

        Long roundId = review.getRoundId();

        if (roundId == null) {

            roundId = boardSlotRepository.findByTeamId(review.getTeamId()).stream()

                    .map(BoardSlot::getRoundId)

                    .filter(id -> id != null)

                    .findFirst()

                    .orElse(null);

        }

        return AiReviewResponse.builder()

                .id(review.getId())

                .teamId(review.getTeamId())

                .teamName(teamName)

                .roundId(roundId)

                .repoCommitId(review.getRepoCommitId())

                .commitSha(commitSha)

                .reviewKind(review.getReviewKind())

                .status(review.getStatus())

                .reviewScore(review.getReviewScore())

                .summary(review.getSummary())

                .issues(review.getIssues())

                .suggestions(review.getSuggestions())

                .ragLevel(review.getRagLevel())

                .aiModel(review.getAiModel())

                .structuredOutput(review.getStructuredOutput())

                .githubIssueUrl(review.getGithubIssueUrl())

                .reviewedAt(review.getReviewedAt())

                .createdAt(review.getCreatedAt())

                .build();

    }

    private boolean isReviewableRepository(TeamRepository repository) {

        return repository != null

                && repository.getProvisionStatus() == RepositoryProvisionStatus.CREATED

                && StringUtils.hasText(repository.getGithubOwner())

                && StringUtils.hasText(repository.getGithubRepoName());

    }

}
