package com.seal.hackathon.aireview.service;



import com.fasterxml.jackson.databind.JsonNode;

import com.fasterxml.jackson.databind.ObjectMapper;

import com.fasterxml.jackson.databind.node.ArrayNode;

import com.fasterxml.jackson.databind.node.ObjectNode;

import com.seal.hackathon.aireview.client.AiReviewLlmClient;

import com.seal.hackathon.aireview.dto.N8nLegacyRepoItem;
import com.seal.hackathon.aireview.dto.AiReviewHealthResponse;
import com.seal.hackathon.aireview.dto.AiReviewResponse;
import com.seal.hackathon.aireview.dto.BackfillCommitsRequest;
import com.seal.hackathon.aireview.dto.BackfillCommitsResponse;
import com.seal.hackathon.aireview.dto.BulkAiReviewFailure;
import com.seal.hackathon.aireview.dto.BulkAiReviewResponse;
import com.seal.hackathon.aireview.dto.RetryFailedReviewsResponse;

import com.seal.hackathon.aireview.entity.AiReview;

import com.seal.hackathon.aireview.entity.RepoCommit;

import com.seal.hackathon.aireview.entity.TeamRepository;

import com.seal.hackathon.aireview.repository.AiReviewRepository;

import com.seal.hackathon.aireview.repository.RepoCommitRepository;

import com.seal.hackathon.aireview.repository.TeamRepositoryEntityRepository;

import com.seal.hackathon.aireview.support.AiReviewDiffBuilder;

import com.seal.hackathon.aireview.support.CommitIngestSource;

import com.seal.hackathon.aireview.support.AiReviewIssueFormatter;

import com.seal.hackathon.aireview.support.AiReviewPrompts;

import com.seal.hackathon.aireview.support.AiReviewValidationException;

import com.seal.hackathon.common.enums.AiReviewKind;

import com.seal.hackathon.common.enums.AiReviewStatus;

import com.seal.hackathon.common.enums.RepositoryProvisionStatus;

import com.seal.hackathon.common.util.GitHubRepoCoordinates;

import com.seal.hackathon.contest.entity.BoardSlot;
import com.seal.hackathon.contest.entity.Problem;
import com.seal.hackathon.contest.entity.Round;

import com.seal.hackathon.contest.repository.BoardSlotRepository;
import com.seal.hackathon.contest.repository.ProblemRepository;
import com.seal.hackathon.contest.repository.RoundRepository;

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

import java.util.Locale;

import java.util.ArrayList;

import java.util.Comparator;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

import java.util.List;

import java.util.Map;

import java.util.Objects;

import java.util.Optional;

import java.util.Set;

import lombok.RequiredArgsConstructor;

import org.slf4j.Logger;

import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Value;

import org.springframework.dao.DataIntegrityViolationException;

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
    private final RoundRepository roundRepository;
    private final ProblemRepository problemRepository;

    private final GitHubRepositoryClient githubRepositoryClient;

    private final ProblemRepositoryTemplateRepository templateRepository;

    private final AiReviewLlmClient aiReviewLlmClient;

    private final AiReviewLlmRunner aiReviewLlmRunner;

    private final AiReviewAccessService aiReviewAccessService;

    private final AiReviewSupabaseMirror aiReviewSupabaseMirror;

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

    @Value("${app.ai.review.max-commits-per-run:100}")

    private int maxCommitsPerRun;

    @Value("${app.ai.review.scheduler-enabled:false}")
    private boolean schedulerEnabled;

    @Value("${app.ai.review.webhook-enabled:true}")
    private boolean webhookReviewEnabled;

    @Value("${app.ai.review.batch-window-hours:1}")
    private int batchWindowHours;

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

        Team team = loadTeam(teamId);
        CurrentReviewScope scope = resolveCurrentReviewScope(teamId, team.getEventId());
        aiReviewAccessService.requireCanViewTeamReviews(teamId, scope.roundId(), scope.boardId());

        return aiReviewRepository.findByTeamIdOrderByReviewedAtDescCreatedAtDesc(teamId).stream()

                .filter(review -> reviewBelongsToCurrentScope(review, scope))

                .map(review -> toResponse(review, team.getName(), null))

                .toList();

    }



    @Transactional(readOnly = true)

    public AiReviewResponse getLatestTeamReview(Long teamId) {

        Team team = loadTeam(teamId);
        CurrentReviewScope scope = resolveCurrentReviewScope(teamId, team.getEventId());
        aiReviewAccessService.requireCanViewTeamReviews(teamId, scope.roundId(), scope.boardId());

        Optional<AiReview> aggregate = aiReviewRepository

                .findByTeamIdAndReviewKindOrderByReviewedAtDescCreatedAtDesc(
                        teamId, AiReviewKind.TEAM_AGGREGATE, PageRequest.of(0, MAX_PRIOR_PUSH_REVIEWS))

                .stream()

                .filter(review -> reviewBelongsToCurrentScope(review, scope))

                .findFirst();

        if (aggregate.isPresent()) {

            return toResponse(aggregate.get(), team.getName(), null);

        }

        return aiReviewRepository

                .findByTeamIdAndReviewKindOrderByReviewedAtDescCreatedAtDesc(
                        teamId, AiReviewKind.PER_PUSH, PageRequest.of(0, MAX_PRIOR_PUSH_REVIEWS))

                .stream()

                .filter(review -> reviewBelongsToCurrentScope(review, scope))

                .findFirst()

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

        Map<Long, CurrentReviewScope> currentScopeByTeam = new LinkedHashMap<>();
        for (Long teamId : teamIds) {
            currentScopeByTeam.put(teamId, resolveCurrentReviewScope(teamId, eventId));
        }

        Map<Long, AiReview> latestByTeam = new LinkedHashMap<>();

        for (AiReview review : aiReviewRepository.findByTeamIdInAndReviewKindOrderByReviewedAtDescCreatedAtDesc(

                teamIds, AiReviewKind.TEAM_AGGREGATE)) {

            if (!reviewBelongsToCurrentScope(review, currentScopeByTeam.get(review.getTeamId()))) {
                continue;
            }
            latestByTeam.putIfAbsent(review.getTeamId(), review);

        }

        for (Long teamId : teamIds) {

            if (!latestByTeam.containsKey(teamId)) {

                aiReviewRepository

                        .findByTeamIdAndReviewKindOrderByReviewedAtDescCreatedAtDesc(
                                teamId, AiReviewKind.PER_PUSH, PageRequest.of(0, MAX_PRIOR_PUSH_REVIEWS))

                        .stream()

                        .filter(review -> reviewBelongsToCurrentScope(review, currentScopeByTeam.get(teamId)))

                        .findFirst()

                        .ifPresent(review -> latestByTeam.put(teamId, review));

            }

        }

        Set<Long> teamsWithReviewableRepo = teamIds.stream()

                .filter(teamId -> resolveReviewableRepository(teamId, eventId).isPresent())

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

                succeeded.add(aiReviewTeamRunner.runForTeam(team.getId(), eventId));

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

                if (reviewRepository(repository, false, CommitIngestSource.SCHEDULER) != null) {

                    completed++;

                }

            } catch (Exception ex) {

                log.warn("AI review failed for team repository {}: {}", repository.getId(), ex.getMessage());

            }

        }

        return completed;

    }

    @Transactional(readOnly = true)
    public List<N8nLegacyRepoItem> listProvisionedReposForLegacyN8n() {
        List<TeamRepository> repositories = teamRepositoryEntityRepository.findReviewableByProvisionStatus(
                RepositoryProvisionStatus.CREATED);
        LinkedHashMap<String, N8nLegacyRepoItem> unique = new LinkedHashMap<>();
        for (TeamRepository repository : repositories) {
            if (!StringUtils.hasText(repository.getGithubOwner())
                    || !StringUtils.hasText(repository.getGithubRepoName())) {
                continue;
            }
            String owner = repository.getGithubOwner().trim();
            String repo = repository.getGithubRepoName().trim();
            String key = (owner + "/" + repo).toLowerCase(Locale.ROOT);
            unique.putIfAbsent(
                    key, new N8nLegacyRepoItem(owner, repo, repository.getTeamId(), repository.getId()));
        }
        return new ArrayList<>(unique.values());
    }

    @Transactional
    public AiReviewResponse triggerTeamReview(Long teamId) {

        Team team = loadTeam(teamId);

        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(team.getEventId());

        enforceManualCooldown(teamId);

        return triggerTeamReviewInternal(teamId, team.getEventId());

    }

    @Transactional
    public AiReviewResponse triggerTeamReview(Long eventId, Long teamId) {
        Team team = loadTeam(teamId);
        if (!eventId.equals(team.getEventId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "TEAM_EVENT_MISMATCH");
        }
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        enforceManualCooldown(teamId);
        return triggerTeamReviewInternal(teamId, eventId);
    }

    @Transactional
    public BackfillCommitsResponse backfillCommits(Long teamId, BackfillCommitsRequest request) {
        Team team = loadTeam(teamId);
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(team.getEventId());
        return backfillCommits(team.getEventId(), teamId, request);
    }

    @Transactional
    public BackfillCommitsResponse backfillCommits(Long eventId, Long teamId, BackfillCommitsRequest request) {
        Team team = loadTeam(teamId);
        if (!eventId.equals(team.getEventId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "TEAM_EVENT_MISMATCH");
        }
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        if (request == null || request.since() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "BACKFILL_SINCE_REQUIRED");
        }
        OffsetDateTime since = request.since();
        OffsetDateTime until = request.until() != null ? request.until() : OffsetDateTime.now();
        if (until.isBefore(since)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "BACKFILL_INVALID_RANGE");
        }

        TeamRepository repository = resolveReviewableRepository(teamId, eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "NO_REVIEWABLE_REPOSITORY"));

        GitHubRepoCoordinates coordinates = GitHubRepoCoordinates.fromTeamRepository(
                        repository.getGithubOwner(), repository.getGithubRepoName(), repository.getRepositoryUrl())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "NO_REVIEWABLE_REPOSITORY"));

        String branch = resolveBranch(repository.getProblemId());
        List<GitHubCommitInfo> commitInfos;
        try {
            commitInfos = githubRepositoryClient.listCommitsSince(
                    coordinates.owner(), coordinates.repoName(), branch, since, until, maxCommitsPerRun);
        } catch (GitHubClientException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "GITHUB_COMMITS_FETCH_FAILED");
        }

        int imported = 0;
        int skipped = 0;
        for (GitHubCommitInfo info : commitInfos) {
            boolean existed = repoCommitRepository
                    .findByTeamRepositoryIdAndCommitSha(repository.getId(), info.getSha())
                    .isPresent();
            Optional<GitHubCommitDetail> detail = githubRepositoryClient.getCommitDetail(
                    coordinates.owner(), coordinates.repoName(), info.getSha());
            if (detail.isEmpty()) {
                skipped++;
                continue;
            }
            upsertRepoCommit(repository, detail.get(), branch, CommitIngestSource.BACKFILL);
            if (existed) {
                skipped++;
            } else {
                imported++;
            }
        }

        boolean runReview = Boolean.TRUE.equals(request.runReview());
        if (runReview && aiReviewLlmClient.isConfigured() && !commitInfos.isEmpty()) {
            reviewRepository(repository, true, CommitIngestSource.BACKFILL);
        }

        return new BackfillCommitsResponse(
                teamId,
                imported,
                skipped,
                commitInfos.size(),
                since,
                until,
                runReview && aiReviewLlmClient.isConfigured() && !commitInfos.isEmpty());
    }

    @Transactional(readOnly = true)
    public AiReviewHealthResponse getEventHealth(Long eventId) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        List<Long> teamIds = registrationTeamRepository.findByEventIdOrderByNameAscIdAsc(eventId).stream()
                .map(Team::getId)
                .toList();

        Set<Long> teamsWithRepo = teamIds.stream()
                .filter(teamId -> resolveReviewableRepository(teamId, eventId).isPresent())
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));

        List<AiReviewResponse> summaries = listEventReviews(eventId);
        int completed = 0;
        int failed = 0;
        int pending = 0;
        for (AiReviewResponse item : summaries) {
            if (item.getStatus() == AiReviewStatus.COMPLETED) {
                completed++;
            } else if (item.getStatus() == AiReviewStatus.FAILED) {
                failed++;
            } else {
                pending++;
            }
        }

        long totalFailedRows = teamIds.isEmpty()
                ? 0
                : aiReviewRepository.countByTeamIdInAndStatus(teamIds, AiReviewStatus.FAILED);
        OffsetDateTime oldestFailed = teamIds.isEmpty()
                ? null
                : aiReviewRepository
                        .findFirstByTeamIdInAndStatusOrderByReviewedAtAsc(teamIds, AiReviewStatus.FAILED)
                        .map(AiReview::getReviewedAt)
                        .orElse(null);

        String recommendation = buildHealthRecommendation(
                aiReviewLlmClient.isConfigured(), teamsWithRepo.size(), failed, totalFailedRows);

        return AiReviewHealthResponse.builder()
                .eventId(eventId)
                .aiConfigured(aiReviewLlmClient.isConfigured())
                .schedulerEnabled(schedulerEnabled)
                .webhookReviewEnabled(webhookReviewEnabled)
                .teamsWithRepository(teamsWithRepo.size())
                .teamsWithCompletedReview(completed)
                .teamsWithFailedReview(failed)
                .teamsPendingReview(pending)
                .totalFailedReviews((int) totalFailedRows)
                .oldestFailedReviewAt(oldestFailed)
                .recommendation(recommendation)
                .build();
    }

    @Transactional
    public RetryFailedReviewsResponse retryFailedReviewsForEvent(Long eventId) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        if (!aiReviewLlmClient.isConfigured()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "AI_REVIEW_NOT_CONFIGURED");
        }
        List<Long> teamIds = registrationTeamRepository.findByEventIdOrderByNameAscIdAsc(eventId).stream()
                .map(Team::getId)
                .toList();
        if (teamIds.isEmpty()) {
            return new RetryFailedReviewsResponse(0, 0, 0, List.of());
        }

        Set<Long> failedTeamIds = aiReviewRepository
                .findByTeamIdInAndStatusOrderByReviewedAtDesc(teamIds, AiReviewStatus.FAILED)
                .stream()
                .map(AiReview::getTeamId)
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));

        return retryTeams(new ArrayList<>(failedTeamIds), eventId);
    }

    @Transactional
    public int retryAllFailedReviews() {
        if (!aiReviewLlmClient.isConfigured()) {
            return 0;
        }
        List<Long> teamIds = aiReviewRepository.findDistinctTeamIdsByStatus(AiReviewStatus.FAILED);
        if (teamIds.isEmpty()) {
            return 0;
        }
        return retryTeams(teamIds, null).teamsSucceeded();
    }

    private RetryFailedReviewsResponse retryTeams(List<Long> teamIds) {
        return retryTeams(teamIds, null);
    }

    private RetryFailedReviewsResponse retryTeams(List<Long> teamIds, Long eventId) {
        List<AiReviewResponse> succeeded = new ArrayList<>();
        List<BulkAiReviewFailure> failures = new ArrayList<>();
        for (Long teamId : teamIds) {
            try {
                succeeded.add(triggerTeamReviewInternal(teamId, eventId));
            } catch (ResponseStatusException ex) {
                Team team = registrationTeamRepository.findById(teamId).orElse(null);
                failures.add(BulkAiReviewFailure.builder()
                        .teamId(teamId)
                        .teamName(team != null ? team.getName() : null)
                        .reason(ex.getReason())
                        .build());
            } catch (RuntimeException ex) {
                Team team = registrationTeamRepository.findById(teamId).orElse(null);
                failures.add(BulkAiReviewFailure.builder()
                        .teamId(teamId)
                        .teamName(team != null ? team.getName() : null)
                        .reason(ex.getMessage())
                        .build());
            }
        }
        return new RetryFailedReviewsResponse(
                teamIds.size(), succeeded.size(), failures.size(), failures);
    }

    @Transactional(readOnly = true)
    public String exportEventReviewsCsv(Long eventId) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        List<AiReviewResponse> reviews = listEventReviews(eventId);
        StringBuilder csv = new StringBuilder();
        csv.append("team_id,team_name,review_kind,status,rag_level,commit_sha,review_score,summary,github_issue_url,reviewed_at\n");
        for (AiReviewResponse review : reviews) {
            if (review.getStatus() == null) {
                continue;
            }
            csv.append(review.getTeamId())
                    .append(',')
                    .append(csvCell(review.getTeamName()))
                    .append(',')
                    .append(csvCell(review.getReviewKind() != null ? review.getReviewKind().name() : ""))
                    .append(',')
                    .append(csvCell(review.getStatus().name()))
                    .append(',')
                    .append(csvCell(review.getRagLevel()))
                    .append(',')
                    .append(csvCell(review.getCommitSha()))
                    .append(',')
                    .append(review.getReviewScore() != null ? review.getReviewScore().toPlainString() : "")
                    .append(',')
                    .append(csvCell(review.getSummary()))
                    .append(',')
                    .append(csvCell(review.getGithubIssueUrl()))
                    .append(',')
                    .append(csvCell(review.getReviewedAt() != null ? review.getReviewedAt().toString() : ""))
                    .append('\n');
        }
        return csv.toString();
    }

    private String buildHealthRecommendation(
            boolean configured, int teamsWithRepo, int teamsFailedLatest, long totalFailedRows) {
        if (!configured) {
            return "Cấu hình AI_API_KEY trước khi chạy review.";
        }
        if (teamsWithRepo == 0) {
            return "Chưa có đội nào được cấp repository — provision repo trước.";
        }
        if (teamsFailedLatest > 0 || totalFailedRows > 0) {
            return "Có review lỗi — dùng «Thử lại lỗi» hoặc bật AI_REVIEW_RETRY_FAILED_ENABLED.";
        }
        return "Hệ thống ổn định — theo dõi webhook và scheduler.";
    }

    private String csvCell(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        String escaped = value.replace("\"", "\"\"");
        if (escaped.contains(",") || escaped.contains("\"") || escaped.contains("\n")) {
            return "\"" + escaped + "\"";
        }
        return escaped;
    }

    @Transactional

    public AiReviewResponse triggerTeamReviewInternal(Long teamId) {
        return triggerTeamReviewInternal(teamId, null);
    }

    @Transactional

    public AiReviewResponse triggerTeamReviewInternal(Long teamId, Long eventId) {

        Team team = loadTeam(teamId);

        Long resolvedEventId = eventId != null ? eventId : team.getEventId();
        if (resolvedEventId != null && !resolvedEventId.equals(team.getEventId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "TEAM_EVENT_MISMATCH");
        }

        TeamRepository repository = resolveReviewableRepository(teamId, resolvedEventId)

                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "NO_REVIEWABLE_REPOSITORY"));

        if (!aiReviewLlmClient.isConfigured()) {

            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "AI_REVIEW_NOT_CONFIGURED");

        }

        AiReview review = reviewRepository(repository, true, CommitIngestSource.MANUAL);

        if (review == null) {

            throw new ResponseStatusException(HttpStatus.CONFLICT, "NO_COMMITS_TO_REVIEW");

        }

        return toResponse(review, team.getName(), review.getCommitSha());

    }

    private Optional<TeamRepository> resolveReviewableRepository(Long teamId, Long eventId) {
        List<TeamRepository> repositories = teamRepositoryEntityRepository.findAllByTeamId(teamId).stream()
                .filter(this::isReviewableRepository)
                .toList();
        if (repositories.isEmpty()) {
            return Optional.empty();
        }
        if (eventId == null) {
            return latestRepository(repositories);
        }

        CurrentReviewScope scope = resolveCurrentReviewScope(teamId, eventId);
        if (scope.problemId() != null) {
            Optional<TeamRepository> exactProblem = repositories.stream()
                    .filter(repository -> Objects.equals(repository.getProblemId(), scope.problemId()))
                    .max(Comparator.comparing(
                            TeamRepository::getUpdatedAt,
                            Comparator.nullsLast(Comparator.naturalOrder())));
            if (exactProblem.isPresent()) {
                return exactProblem;
            }
        }
        if (scope.roundId() != null) {
            Optional<TeamRepository> exactRound = repositories.stream()
                    .filter(repository -> Objects.equals(repository.getRoundId(), scope.roundId()))
                    .max(Comparator.comparing(
                            TeamRepository::getUpdatedAt,
                            Comparator.nullsLast(Comparator.naturalOrder())));
            if (exactRound.isPresent()) {
                return exactRound;
            }
        }
        return latestRepository(repositories);
    }

    private Optional<TeamRepository> latestRepository(List<TeamRepository> repositories) {
        return repositories.stream()
                .max(Comparator.comparing(
                        TeamRepository::getUpdatedAt,
                        Comparator.nullsLast(Comparator.naturalOrder())));
    }

    private CurrentReviewScope resolveCurrentReviewScope(Long teamId, Long eventId) {
        if (eventId == null) {
            return CurrentReviewScope.empty();
        }
        List<BoardSlot> eventSlots = boardSlotRepository.findByTeamId(teamId).stream()
                .filter(slot -> slot.getRoundId() != null)
                .filter(slot -> roundRepository.findById(slot.getRoundId())
                        .map(round -> eventId.equals(round.getEventId()))
                        .orElse(false))
                .toList();
        if (eventSlots.isEmpty()) {
            return CurrentReviewScope.empty();
        }

        List<Round> eventRounds = roundRepository.findByEventId(eventId);
        Round activeRound = resolveActiveRound(eventRounds, OffsetDateTime.now()).orElse(null);
        BoardSlot selectedSlot = null;
        if (activeRound != null) {
            selectedSlot = eventSlots.stream()
                    .filter(slot -> activeRound.getId().equals(slot.getRoundId()))
                    .findFirst()
                    .orElse(null);
        }
        if (selectedSlot == null) {
            selectedSlot = eventSlots.stream()
                    .max(Comparator.comparing(
                            slot -> roundRepository.findById(slot.getRoundId())
                                    .map(Round::getRoundOrder)
                                    .orElse(Integer.MIN_VALUE),
                            Comparator.nullsLast(Integer::compareTo)))
                    .orElse(null);
        }
        if (selectedSlot == null) {
            return CurrentReviewScope.empty();
        }
        return new CurrentReviewScope(
                selectedSlot.getRoundId(),
                selectedSlot.getBoardId(),
                resolvePrimaryProblemId(selectedSlot.getBoardId()));
    }

    private Optional<Round> resolveActiveRound(List<Round> rounds, OffsetDateTime now) {
        if (rounds == null || rounds.isEmpty()) {
            return Optional.empty();
        }
        List<Round> sorted = rounds.stream()
                .sorted(Comparator.comparing(Round::getRoundOrder, Comparator.nullsLast(Integer::compareTo)))
                .toList();
        Optional<Round> running = sorted.stream()
                .filter(round -> round.getStartAt() != null
                        && round.getEndAt() != null
                        && !now.isBefore(round.getStartAt())
                        && now.isBefore(round.getEndAt()))
                .findFirst();
        if (running.isPresent()) {
            return running;
        }
        Optional<Round> upcoming = sorted.stream()
                .filter(round -> round.getStartAt() != null && now.isBefore(round.getStartAt()))
                .min(Comparator.comparing(Round::getStartAt));
        return upcoming.or(() -> Optional.of(sorted.get(sorted.size() - 1)));
    }

    private Long resolvePrimaryProblemId(Long boardId) {
        if (boardId == null) {
            return null;
        }
        return problemRepository.findByBoardId(boardId).stream()
                .min(Comparator.comparing(Problem::getReleaseAt, Comparator.nullsLast(OffsetDateTime::compareTo))
                        .thenComparing(Problem::getId, Comparator.nullsLast(Long::compareTo)))
                .map(Problem::getId)
                .orElse(null);
    }

    private boolean reviewBelongsToCurrentScope(AiReview review, CurrentReviewScope scope) {
        if (review == null || scope == null || scope.roundId() == null) {
            return true;
        }
        if (review.getTeamRepositoryId() != null) {
            return teamRepositoryEntityRepository.findById(review.getTeamRepositoryId())
                    .map(repository -> scope.problemId() != null
                            ? Objects.equals(repository.getProblemId(), scope.problemId())
                            : Objects.equals(repository.getRoundId(), scope.roundId()))
                    .orElse(false);
        }
        return Objects.equals(review.getRoundId(), scope.roundId());
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
            reviewRepository(repository, true, CommitIngestSource.WEBHOOK);
        } catch (Exception ex) {
            log.warn("AI review on push failed for repository {}: {}", teamRepositoryId, ex.getMessage());
        }
    }

    private AiReview reviewRepository(TeamRepository repository, boolean force, CommitIngestSource ingestSource) {

        GitHubRepoCoordinates coordinates = GitHubRepoCoordinates.fromTeamRepository(

                        repository.getGithubOwner(), repository.getGithubRepoName(), repository.getRepositoryUrl())

                .orElse(null);

        if (coordinates == null) {

            scheduleNext(repository, OffsetDateTime.now(), false);

            return null;

        }



        String branch = resolveBranch(repository.getProblemId());

        OffsetDateTime windowStart = OffsetDateTime.now().minusHours(Math.max(batchWindowHours, 1));

        OffsetDateTime since = repository.getLastReviewedAt();

        if (force && since == null) {

            since = OffsetDateTime.now().minusDays(7);

        } else if (!force) {

            if (since == null || since.isBefore(windowStart)) {

                since = windowStart;

            }

        }



        List<GitHubCommitInfo> commitInfos;

        try {

            commitInfos = githubRepositoryClient.listCommitsSince(

                    coordinates.owner(), coordinates.repoName(), branch, since, null, maxCommitsPerRun);

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

            latestSavedCommit = upsertRepoCommit(repository, detail.get(), branch, ingestSource);

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

        String modifiedFilesList = AiReviewDiffBuilder.buildModifiedFilesList(details);

        String configFilesDetected = AiReviewDiffBuilder.buildConfigFilesDetected(details);

        String codeChanges = AiReviewDiffBuilder.buildCodeChangesDetail(details);

        String headCommitSha = latestSavedCommit != null && StringUtils.hasText(latestSavedCommit.getCommitSha())
                ? latestSavedCommit.getCommitSha()
                : (details.isEmpty() ? "unknown" : details.get(details.size() - 1).getSha());

        String prompt = AiReviewPrompts.perPushPrompt(

                team.getName(),

                repoLabel,

                headCommitSha,

                details.size(),

                activityLog,

                modifiedFilesList,

                configFilesDetected,

                codeChanges);



        AiReview pending = prepareReviewRow(

                repository, latestSavedCommit, AiReviewKind.PER_PUSH, now);

        pending = aiReviewRepository.save(pending);



        try {

            pending.setStatus(AiReviewStatus.LLM_STARTED);

            pending = aiReviewRepository.save(pending);

            AiReviewLlmRunner.LlmJsonResult llmResult = aiReviewLlmRunner.invokeValidated(prompt, AiReviewKind.PER_PUSH);

            String json = llmResult.rawJson();

            JsonNode root = llmResult.root();

            pending.setStatus(AiReviewStatus.COMPLETED);

            pending.setStructuredOutput(json);

            pending.setSummary(textAt(root, "overall_picture", "push_summary"));

            if (!StringUtils.hasText(pending.getSummary())) {

                pending.setSummary(textAt(root, "overall_picture", "project_about"));

            }

            pending.setRagLevel(textAt(root, "rag_maturity", "level"));

            pending.setIssues(buildIssuesJson(root));

            pending.setSuggestions(buildSuggestionsJson(root));

            pending.setReviewedAt(now);

            return saveAndMirror(pending);

        } catch (AiReviewValidationException ex) {

            pending.setStatus(AiReviewStatus.FAILED);

            pending.setSummary("AI review validation failed: " + String.join("; ", ex.violations()));

            pending.setReviewedAt(now);

            saveAndMirror(pending);

            log.warn("Per-push AI review validation failed for team {}: {}", team.getId(), ex.getMessage());

            return pending;

        } catch (Exception ex) {

            pending.setStatus(AiReviewStatus.FAILED);

            pending.setSummary("AI review failed: " + ex.getMessage());

            pending.setReviewedAt(now);

            saveAndMirror(pending);

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

                saveAndMirror(perPush);

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

            String commitHistoryJson = buildCommitHistoryJson(repository);

            String priorReviewsJson = buildPriorPushReviewsJson(
                    repository.getTeamId(), repository.getRoundId(), perPush.getId());

            String currentPushJson = perPush.getStructuredOutput();

            String prompt = AiReviewPrompts.teamAggregatePrompt(

                    team.getName(), repoLabel, commitHistoryJson, priorReviewsJson, currentPushJson);



            AiReview pending = prepareReviewRow(

                    repository, latestSavedCommit, AiReviewKind.TEAM_AGGREGATE, now);

            pending = aiReviewRepository.save(pending);



            pending.setStatus(AiReviewStatus.LLM_STARTED);

            pending = aiReviewRepository.save(pending);

            AiReviewLlmRunner.LlmJsonResult llmResult =
                    aiReviewLlmRunner.invokeValidated(prompt, AiReviewKind.TEAM_AGGREGATE);

            String json = llmResult.rawJson();

            JsonNode root = llmResult.root();

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

            pending.setIssues(buildAggregateIssuesJson(root));

            pending.setSuggestions(buildAggregateSuggestionsJson(root, perPushRoot));

            pending.setReviewedAt(now);

            return saveAndMirror(pending);

        } catch (AiReviewValidationException ex) {

            log.warn("Team aggregate AI review validation failed for team {}: {}", team.getId(), ex.getMessage());

            AiReview failed = prepareReviewRow(

                    repository, latestSavedCommit, AiReviewKind.TEAM_AGGREGATE, now);

            failed.setStatus(AiReviewStatus.FAILED);

            failed.setSummary("Aggregate review validation failed: " + String.join("; ", ex.violations()));

            failed.setReviewedAt(now);

            return saveAndMirror(failed);

        } catch (Exception ex) {

            log.warn("Team aggregate AI review failed for team {}: {}", team.getId(), ex.getMessage());

            AiReview failed = prepareReviewRow(

                    repository, latestSavedCommit, AiReviewKind.TEAM_AGGREGATE, now);

            failed.setStatus(AiReviewStatus.FAILED);

            failed.setSummary("Aggregate review failed: " + ex.getMessage());

            failed.setReviewedAt(now);

            return saveAndMirror(failed);

        }

    }



    private String buildCommitHistoryJson(TeamRepository repository) throws Exception {

        List<Long> repoIds = repository.getId() == null ? List.of() : List.of(repository.getId());

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



    private String buildPriorPushReviewsJson(Long teamId, Long roundId, Long excludeReviewId) throws Exception {

        List<AiReview> prior = aiReviewRepository.findByTeamIdAndReviewKindOrderByReviewedAtDescCreatedAtDesc(

                teamId, AiReviewKind.PER_PUSH, PageRequest.of(0, MAX_PRIOR_PUSH_REVIEWS));

        ArrayNode array = objectMapper.createArrayNode();

        for (AiReview review : prior) {

            if (review.getId().equals(excludeReviewId) || review.getStatus() != AiReviewStatus.COMPLETED) {

                continue;

            }
            if (roundId != null && !roundId.equals(review.getRoundId())) {

                continue;

            }

            ObjectNode node = objectMapper.createObjectNode();

            node.put("commit_sha", review.getCommitSha());

            node.put("push_summary", review.getSummary());

            node.put("rag_level", review.getRagLevel());

            if (StringUtils.hasText(review.getStructuredOutput())) {

                try {

                    JsonNode structured = objectMapper.readTree(review.getStructuredOutput());

                    JsonNode overall = structured.path("overall_picture");

                    if (!overall.isMissingNode() && !overall.isNull()) {

                        node.set("overall_picture", overall);

                    }

                    JsonNode pushSummaryNode = overall.path("push_summary");

                    if (pushSummaryNode.isTextual() && StringUtils.hasText(pushSummaryNode.asText())) {

                        node.put("push_summary", pushSummaryNode.asText());

                    }

                } catch (Exception ignored) {

                    // keep summary / rag_level only

                }

            }

            array.add(node);

        }

        return objectMapper.writeValueAsString(array);

    }



    private RepoCommit upsertRepoCommit(

            TeamRepository repository, GitHubCommitDetail detail, String branch, CommitIngestSource source) {

        Optional<RepoCommit> existing =

                repoCommitRepository.findByTeamRepositoryIdAndCommitSha(repository.getId(), detail.getSha());

        if (existing.isPresent()) {

            return existing.get();

        }

        OffsetDateTime now = OffsetDateTime.now();

        try {
            return repoCommitRepository.save(RepoCommit.builder()

                .teamRepositoryId(repository.getId())

                .commitSha(detail.getSha())

                .authorName(detail.getAuthorName())

                .authorEmail(detail.getAuthorEmail())

                .message(trimMessage(detail.getMessage()))

                .committedAt(detail.getCommittedAt())

                .branch(branch)

                .commitUrl(detail.getHtmlUrl())

                .source(source.value())

                .createdAt(now)

                .build());
        } catch (DataIntegrityViolationException ex) {
            return repoCommitRepository.findByTeamRepositoryIdAndCommitSha(repository.getId(), detail.getSha())
                    .orElseThrow(() -> ex);
        }

    }

    private AiReview prepareReviewRow(

            TeamRepository repository,

            RepoCommit latestSavedCommit,

            AiReviewKind reviewKind,

            OffsetDateTime now) {

        Optional<AiReview> existing = repository.getId() != null
                ? aiReviewRepository.findByTeamRepositoryIdAndCommitShaAndReviewKind(
                        repository.getId(), latestSavedCommit.getCommitSha(), reviewKind)
                : aiReviewRepository.findByTeamIdAndCommitShaAndReviewKind(
                        repository.getTeamId(), latestSavedCommit.getCommitSha(), reviewKind);

        AiReview review = existing.orElseGet(() -> AiReview.builder()

                .teamId(repository.getTeamId())

                .commitSha(latestSavedCommit.getCommitSha())

                .reviewKind(reviewKind)

                .createdAt(now)

                .build());

        review.setRoundId(repository.getRoundId());

        review.setTeamRepositoryId(repository.getId());

        review.setRepoCommitId(latestSavedCommit.getId());

        review.setStatus(AiReviewStatus.PENDING);

        review.setReviewScore(null);

        review.setAiModel(aiModel);

        review.setSummary(null);

        review.setIssues(null);

        review.setSuggestions(null);

        review.setStructuredOutput(null);

        review.setRagLevel(null);

        review.setReviewScore(null);

        review.setReviewedAt(null);

        if (reviewKind != AiReviewKind.PER_PUSH) {

            review.setGithubIssueUrl(null);

        }

        return review;

    }

    private AiReview saveAndMirror(AiReview review) {
        AiReview saved = aiReviewRepository.save(review);
        aiReviewSupabaseMirror.mirror(saved);
        return saved;
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

        appendTextArray(suggestions, root.path("suggested_prompt_refinement"));

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

    private Long resolveReviewRoundId(AiReview review) {
        if (review.getRoundId() != null) {
            return review.getRoundId();
        }
        if (review.getTeamRepositoryId() != null) {
            Optional<Long> repositoryRoundId = teamRepositoryEntityRepository.findById(review.getTeamRepositoryId())
                    .map(TeamRepository::getRoundId);
            if (repositoryRoundId.isPresent()) {
                return repositoryRoundId.get();
            }
        }
        if (review.getRepoCommitId() != null) {
            return repoCommitRepository.findById(review.getRepoCommitId())
                    .flatMap(commit -> teamRepositoryEntityRepository.findById(commit.getTeamRepositoryId()))
                    .map(TeamRepository::getRoundId)
                    .orElse(null);
        }
        return null;
    }



    private AiReviewResponse toResponse(AiReview review, String teamName, String commitShaOverride) {

        String commitSha = commitShaOverride != null

                ? commitShaOverride

                : (StringUtils.hasText(review.getCommitSha())

                        ? review.getCommitSha()

                        : latestCommitSha(review.getRepoCommitId()));

        Long roundId = resolveReviewRoundId(review);

        return AiReviewResponse.builder()

                .id(review.getId())

                .teamId(review.getTeamId())

                .teamName(teamName)

                .roundId(roundId)

                .repoCommitId(review.getRepoCommitId())

                .commitSha(commitSha)

                .reviewKind(review.getReviewKind())

                .status(review.getStatus())

                .handoverStatus(review.getStatus() != null ? review.getStatus().toHandoverStatus() : null)

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

    private record CurrentReviewScope(Long roundId, Long boardId, Long problemId) {
        static CurrentReviewScope empty() {
            return new CurrentReviewScope(null, null, null);
        }
    }

}
