package com.seal.hackathon.github.service;

import com.seal.hackathon.aireview.entity.TeamRepository;
import com.seal.hackathon.aireview.repository.RepositoryStatusStatsProjection;
import com.seal.hackathon.aireview.repository.TeamRepositoryEntityRepository;
import com.seal.hackathon.assignment.entity.JudgeAssignment;
import com.seal.hackathon.assignment.repository.JudgeAssignmentRepository;
import com.seal.hackathon.authprofile.security.AuthCredentialPolicy;
import com.seal.hackathon.authprofile.entity.User;
import com.seal.hackathon.authprofile.repository.UserRepository;
import com.seal.hackathon.authprofile.security.CurrentUserPrincipal;
import com.seal.hackathon.authprofile.security.CurrentUserProvider;
import com.seal.hackathon.common.enums.RepositoryAccessStatus;
import com.seal.hackathon.common.enums.RepositoryProvisionStatus;
import com.seal.hackathon.common.enums.SubmissionStatus;
import com.seal.hackathon.common.enums.TeamMemberStatus;
import com.seal.hackathon.common.enums.TeamStatus;
import com.seal.hackathon.common.security.OrganizerAuthorizationService;
import com.seal.hackathon.contest.entity.Board;
import com.seal.hackathon.contest.entity.BoardSlot;
import com.seal.hackathon.contest.entity.Problem;
import com.seal.hackathon.contest.entity.Round;
import com.seal.hackathon.contest.repository.BoardRepository;
import com.seal.hackathon.contest.repository.BoardSlotRepository;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.contest.repository.ProblemRepository;
import com.seal.hackathon.contest.repository.RoundRepository;
import com.seal.hackathon.github.client.GitHubClientException;
import com.seal.hackathon.github.client.GitHubRepositoryClient;
import com.seal.hackathon.github.client.GitHubRepositoryInfo;
import com.seal.hackathon.github.dto.EventRepositoriesPageResponse;
import com.seal.hackathon.github.dto.GrantJudgeAccessResponse;
import com.seal.hackathon.github.dto.JudgeAccessGrantItem;
import com.seal.hackathon.github.dto.JudgeRepositoryResponse;
import com.seal.hackathon.github.dto.ProvisionProblemRepositoriesResponse;
import com.seal.hackathon.github.dto.RepoTemplateResponse;
import com.seal.hackathon.github.dto.RepositoryLockResponse;
import com.seal.hackathon.github.dto.RepositoryRetryResponse;
import com.seal.hackathon.github.dto.RepositoryStatusStatsResponse;
import com.seal.hackathon.github.dto.SaveRepoTemplateRequest;
import com.seal.hackathon.github.dto.TeamRepositoryResponse;
import com.seal.hackathon.github.entity.JudgeRepositoryAccessGrant;
import com.seal.hackathon.github.entity.ProblemRepositoryTemplate;
import com.seal.hackathon.github.repository.ProblemRepositoryTemplateRepository;
import com.seal.hackathon.assignment.service.BoardScoringReadinessService;
import com.seal.hackathon.github.util.GitHubRepositoryNameSlug;
import com.seal.hackathon.contest.entity.Event;
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.entity.TeamMember;
import com.seal.hackathon.registration.repository.TeamMemberRepository;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
@RequiredArgsConstructor
public class RepositoryProvisioningService {

    private static final int DEFAULT_REVIEW_INTERVAL_MINUTES = 60;
    private static final int MAX_REPO_PAGE_SIZE = 200;

    private final ProblemRepositoryTemplateRepository templateRepository;
    private final TeamRepositoryEntityRepository teamRepositoryEntityRepository;
    private final ProblemRepository problemRepository;
    private final BoardRepository boardRepository;
    private final RoundRepository roundRepository;
    private final BoardSlotRepository boardSlotRepository;
    private final EventRepository eventRepository;
    private final com.seal.hackathon.registration.repository.TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;
    private final GitHubRepositoryClient githubRepositoryClient;
    private final OrganizerAuthorizationService organizerAuthorizationService;
    private final BoardScoringReadinessService boardScoringReadinessService;
    private final JudgeAssignmentRepository judgeAssignmentRepository;
    private final CurrentUserProvider currentUserProvider;
    private final RepoCommitService repoCommitService;
    private final com.seal.hackathon.github.repository.JudgeRepositoryAccessGrantRepository
            judgeRepositoryAccessGrantRepository;
    private final com.seal.hackathon.notification.service.NotificationService notificationService;

    @Value("${app.github.org:}")
    private String githubOrg;

    @Value("${app.github.template-owner:}")
    private String configuredTemplateOwner;

    @Value("${app.github.template-repo:}")
    private String configuredTemplateRepo;

    @Value("${app.github.default-branch:main}")
    private String configuredDefaultBranch;

    @Value("${app.github.webhook-url:}")
    private String configuredWebhookUrl;

    @Value("${app.mail.api-base-url:http://localhost:8085}")
    private String mailApiBaseUrl;

    @Value("${app.github.webhook-secret:}")
    private String webhookSecret;

    @Value("${app.github.webhook-auto-register:true}")
    private boolean webhookAutoRegister;

    @Value("${app.ai.review.webhook-enabled:true}")
    private boolean webhookReviewEnabled;

    @Transactional
    public RepoTemplateResponse saveProblemTemplate(
            Long problemId,
            SaveRepoTemplateRequest request,
            Long currentUserId) {
        ProblemScope scope = loadProblemScope(problemId);
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(scope.round().getEventId());
        OffsetDateTime now = OffsetDateTime.now();
        ProblemRepositoryTemplate template = templateRepository.findByProblemId(problemId)
                .orElseGet(() -> ProblemRepositoryTemplate.builder()
                        .problemId(problemId)
                        .createdAt(now)
                        .createdBy(currentUserId)
                        .build());
        template.setTemplateOwner(normalizeRequired(request.getTemplateOwner(), "templateOwner must not be blank"));
        template.setTemplateRepo(normalizeRequired(request.getTemplateRepo(), "templateRepo must not be blank"));
        template.setDefaultBranch(StringUtils.hasText(request.getDefaultBranch())
                ? request.getDefaultBranch().trim()
                : defaultBranch());
        template.setEnabled(request.getEnabled() == null || request.getEnabled());
        template.setUpdatedAt(now);
        return toTemplateResponse(templateRepository.save(template));
    }

    @Transactional
    public RepoTemplateResponse getOrCreateProblemTemplate(Long problemId, Long currentUserId) {
        ProblemScope scope = loadProblemScope(problemId);
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(scope.round().getEventId());
        return templateRepository.findByProblemId(problemId)
                .map(this::toTemplateResponse)
                .orElseGet(() -> saveProblemTemplate(problemId, defaultTemplateRequest(), currentUserId));
    }

    @Transactional(readOnly = true)
    public RepoTemplateResponse getProblemTemplate(Long problemId) {
        ProblemScope scope = loadProblemScope(problemId);
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(scope.round().getEventId());
        return templateRepository.findByProblemId(problemId)
                .map(this::toTemplateResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Repository template not found"));
    }

    @Transactional
    public ProvisionProblemRepositoriesResponse provisionForProblem(Long problemId, boolean force, Long currentUserId) {
        ProblemScope scope = loadProblemScope(problemId);
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(scope.round().getEventId());
        return provisionForProblemInternal(problemId, force, currentUserId, false);
    }

    private ProvisionProblemRepositoriesResponse provisionForProblemInternal(
            Long problemId, boolean force, Long currentUserId, boolean retryFailed) {
        ProblemScope scope = loadProblemScope(problemId);
        ProblemRepositoryTemplate template = templateRepository.findByProblemId(problemId)
                .filter(item -> Boolean.TRUE.equals(item.getEnabled()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Repository template is missing"));
        OffsetDateTime now = OffsetDateTime.now();
        if (!force && scope.problem().getReleaseAt() != null && now.isBefore(scope.problem().getReleaseAt())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Problem is not released yet");
        }

        List<Team> eligibleTeams = findEligibleTeams(scope);
        List<TeamRepositoryResponse> responses = new ArrayList<>();
        int created = 0;
        int failed = 0;
        int skipped = 0;

        for (Team team : eligibleTeams) {
            TeamRepository existing = teamRepositoryEntityRepository
                    .findByTeamIdAndProblemId(team.getId(), problemId)
                    .orElse(null);
            if (existing != null) {
                if (retryFailed && shouldRetryProvision(existing)) {
                    ProvisionOutcome outcome = provisionRepository(existing, team, template, scope, now);
                    responses.add(toRepositoryResponse(outcome.repository(), true));
                    if (outcome.created()) {
                        created++;
                    } else if (outcome.failed()) {
                        failed++;
                    } else {
                        skipped++;
                    }
                    continue;
                }
                responses.add(toRepositoryResponse(existing, true));
                skipped++;
                continue;
            }

            TeamRepository repository = initializeRepository(team, scope, currentUserId, now);
            ProvisionOutcome outcome = provisionRepository(repository, team, template, scope, now);
            responses.add(toRepositoryResponse(outcome.repository(), true));
            if (outcome.created()) {
                created++;
            } else if (outcome.failed()) {
                failed++;
            } else {
                skipped++;
            }
        }

        if (created > 0 || skipped > 0) {
            boardScoringReadinessService.notifyReadyJudgesForBoard(scope.board().getId());
        }

        return ProvisionProblemRepositoriesResponse.builder()
                .problemId(problemId)
                .boardId(scope.board().getId())
                .roundId(scope.round().getId())
                .totalTeams(eligibleTeams.size())
                .createdCount(created)
                .failedCount(failed)
                .skippedCount(skipped)
                .repositories(responses)
                .build();
    }

    @Transactional
    public RepositoryLockResponse lockProblemRepositories(Long problemId) {
        ProblemScope scope = loadProblemScope(problemId);
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(scope.round().getEventId());
        return lockProblemRepositoriesInternal(scope.problem(), OffsetDateTime.now());
    }

    @Transactional
    public RepositoryLockResponse lockRoundRepositories(Long roundId) {
        Round round = roundRepository.findById(roundId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Round not found"));
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(round.getEventId());
        OffsetDateTime now = OffsetDateTime.now();
        List<Problem> problems = problemRepository.findByBoardIdIn(
                boardRepository.findByRoundId(roundId).stream().map(Board::getId).toList());
        if (problems.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "NO_PROBLEMS_IN_ROUND");
        }
        List<TeamRepositoryResponse> responses = new ArrayList<>();
        int locked = 0;
        int failed = 0;
        int total = 0;
        for (Problem problem : problems) {
            if (problem.getCloseAt() == null || now.isBefore(problem.getCloseAt())) {
                continue;
            }
            RepositoryLockResponse result = lockProblemRepositoriesInternal(problem, now);
            locked += result.getLockedCount();
            failed += result.getFailedCount();
            total += result.getTotalRepositories();
            responses.addAll(result.getRepositories());
        }
        if (total == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "PROBLEM_NOT_CLOSED");
        }
        if (locked > 0 && hasPendingJudgeGrantsForRound(roundId)) {
            grantJudgeAccessForRoundInternal(roundId);
        }
        return RepositoryLockResponse.builder()
                .roundId(roundId)
                .totalRepositories(total)
                .lockedCount(locked)
                .failedCount(failed)
                .repositories(responses)
                .build();
    }

    @Transactional
    public int provisionDueRepositories() {
        OffsetDateTime now = OffsetDateTime.now();
        ensureDefaultTemplatesForReleasedProblems(now);
        int createdTotal = 0;
        int processedProblems = 0;
        for (ProblemRepositoryTemplate template : templateRepository.findByEnabledTrue()) {
            Problem problem = problemRepository.findById(template.getProblemId()).orElse(null);
            if (problem == null || problem.getReleaseAt() == null || now.isBefore(problem.getReleaseAt())) {
                continue;
            }
            if (isProblemFullyProvisioned(problem.getId())) {
                continue;
            }
            processedProblems++;
            try {
                ProvisionProblemRepositoriesResponse result = provisionForProblemInternal(
                        problem.getId(), false, null, true);
                createdTotal += result.getCreatedCount();
                log.info(
                        "GitHub auto-provision problemId={} title='{}': created={}, failed={}, skipped={}, eligible={}",
                        problem.getId(),
                        problem.getTitle(),
                        result.getCreatedCount(),
                        result.getFailedCount(),
                        result.getSkippedCount(),
                        result.getTotalTeams());
            } catch (RuntimeException ex) {
                log.warn(
                        "GitHub auto-provision skipped problemId={}: {}",
                        template.getProblemId(),
                        ex.getMessage());
            }
        }
        if (processedProblems == 0) {
            log.debug(
                    "GitHub auto-provision: no released problems with enabled template at {}",
                    now);
        }
        return createdTotal;
    }

    /** Scheduler: tạo mẫu repo mặc định khi đề đã mở — BTC chưa cần mở trang Repository. */
    private void ensureDefaultTemplatesForReleasedProblems(OffsetDateTime now) {
        if (!hasDefaultTemplateConfig()) {
            return;
        }
        for (Problem problem : problemRepository.findAll()) {
            if (problem.getReleaseAt() == null || now.isBefore(problem.getReleaseAt())) {
                continue;
            }
            if (templateRepository.findByProblemId(problem.getId()).isPresent()) {
                continue;
            }
            try {
                persistDefaultTemplate(problem.getId(), now);
                log.info(
                        "GitHub auto-provision: created default repo template for problemId={} title='{}'",
                        problem.getId(),
                        problem.getTitle());
            } catch (RuntimeException ex) {
                log.warn(
                        "GitHub auto-provision: could not create template for problemId={}: {}",
                        problem.getId(),
                        ex.getMessage());
            }
        }
    }

    private void persistDefaultTemplate(Long problemId, OffsetDateTime now) {
        SaveRepoTemplateRequest request = defaultTemplateRequest();
        ProblemRepositoryTemplate template = ProblemRepositoryTemplate.builder()
                .problemId(problemId)
                .createdAt(now)
                .build();
        template.setTemplateOwner(normalizeRequired(request.getTemplateOwner(), "templateOwner must not be blank"));
        template.setTemplateRepo(normalizeRequired(request.getTemplateRepo(), "templateRepo must not be blank"));
        template.setDefaultBranch(StringUtils.hasText(request.getDefaultBranch())
                ? request.getDefaultBranch().trim()
                : defaultBranch());
        template.setEnabled(request.getEnabled() == null || request.getEnabled());
        template.setUpdatedAt(now);
        templateRepository.save(template);
    }

    private boolean hasDefaultTemplateConfig() {
        return StringUtils.hasText(resolveConfiguredTemplateOwner())
                && StringUtils.hasText(configuredTemplateRepo);
    }

    private boolean shouldRetryProvision(TeamRepository repository) {
        return repository.getProvisionStatus() != RepositoryProvisionStatus.CREATED;
    }

    @Transactional
    public int closeRepositoriesForClosedProblems() {
        OffsetDateTime now = OffsetDateTime.now();
        int lockedTotal = 0;
        Set<Long> roundsToGrant = new LinkedHashSet<>();
        for (Problem problem : problemRepository.findByCloseAtLessThanEqual(now)) {
            int locked = lockOpenRepositories(
                            teamRepositoryEntityRepository.findByProblemIdOrderByTeamIdAsc(problem.getId()),
                            now)
                    .locked();
            lockedTotal += locked;
            if (locked > 0) {
                boardRepository.findById(problem.getBoardId())
                        .map(Board::getRoundId)
                        .ifPresent(roundsToGrant::add);
            }
        }
        for (Long roundId : roundsToGrant) {
            if (hasPendingJudgeGrantsForRound(roundId)) {
                grantJudgeAccessForRoundInternal(roundId);
            }
        }
        return lockedTotal;
    }

    private RepositoryLockResponse lockProblemRepositoriesInternal(Problem problem, OffsetDateTime now) {
        if (problem.getCloseAt() == null || now.isBefore(problem.getCloseAt())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "PROBLEM_NOT_CLOSED");
        }
        List<TeamRepository> repositories = teamRepositoryEntityRepository
                .findByProblemIdOrderByTeamIdAsc(problem.getId());
        LockBatchResult result = lockOpenRepositories(repositories, now);
        if (result.locked() > 0) {
            boardRepository.findById(problem.getBoardId())
                    .map(Board::getRoundId)
                    .filter(this::hasPendingJudgeGrantsForRound)
                    .ifPresent(this::grantJudgeAccessForRoundInternal);
        }
        return RepositoryLockResponse.builder()
                .problemId(problem.getId())
                .totalRepositories(repositories.size())
                .lockedCount(result.locked())
                .failedCount(result.failed())
                .repositories(result.responses())
                .build();
    }

    private LockBatchResult lockOpenRepositories(List<TeamRepository> repositories, OffsetDateTime now) {
        List<TeamRepositoryResponse> responses = new ArrayList<>();
        int locked = 0;
        int failed = 0;

        for (TeamRepository repository : repositories) {
            if (repository.getAccessStatus() != RepositoryAccessStatus.OPEN) {
                continue;
            }
            OffsetDateTime problemCloseAt = resolveProblemCloseAt(repository.getProblemId());
            finalizeSubmissionAtClose(repository, problemCloseAt, now);
            if (!StringUtils.hasText(repository.getGithubOwner())
                    || !StringUtils.hasText(repository.getGithubRepoName())) {
                repository.setUpdatedAt(now);
                responses.add(toRepositoryResponse(teamRepositoryEntityRepository.save(repository), true));
                continue;
            }
            try {
                githubRepositoryClient.protectBranchFromPush(
                        repository.getGithubOwner(),
                        repository.getGithubRepoName(),
                        resolveRepositoryBranch(repository));
                for (String username : loadConfirmedGithubUsernames(repository.getTeamId())) {
                    githubRepositoryClient.updateCollaboratorPermission(
                            repository.getGithubOwner(),
                            repository.getGithubRepoName(),
                            username,
                            "pull");
                }
                repository.setAccessStatus(RepositoryAccessStatus.CLOSED);
                repository.setClosedAt(now);
                repository.setLastError(null);
                locked++;
            } catch (GitHubClientException ex) {
                repository.setAccessStatus(RepositoryAccessStatus.FAILED);
                repository.setLastError(sanitizeError(ex.getMessage()));
                failed++;
            }
            repository.setUpdatedAt(now);
            responses.add(toRepositoryResponse(teamRepositoryEntityRepository.save(repository), true));
        }

        return new LockBatchResult(locked, failed, responses);
    }

    private void closeExpiredRepositoriesForTeam(Long teamId) {
        OffsetDateTime now = OffsetDateTime.now();
        Set<Long> roundsToGrant = new LinkedHashSet<>();
        for (TeamRepository repository : teamRepositoryEntityRepository.findAllByTeamId(teamId)) {
            if (repository.getAccessStatus() != RepositoryAccessStatus.OPEN || repository.getProblemId() == null) {
                continue;
            }
            Problem problem = problemRepository.findById(repository.getProblemId()).orElse(null);
            if (problem == null || problem.getCloseAt() == null || now.isBefore(problem.getCloseAt())) {
                continue;
            }
            int locked = lockOpenRepositories(List.of(repository), now).locked();
            if (locked > 0) {
                boardRepository.findById(problem.getBoardId())
                        .map(Board::getRoundId)
                        .ifPresent(roundsToGrant::add);
            }
        }
        for (Long roundId : roundsToGrant) {
            if (hasPendingJudgeGrantsForRound(roundId)) {
                grantJudgeAccessForRoundInternal(roundId);
            }
        }
    }

    @Transactional
    public RepositoryRetryResponse retryRepository(Long repositoryId, Long currentUserId) {
        TeamRepository repository = teamRepositoryEntityRepository.findById(repositoryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Repository not found"));
        if (repository.getProblemId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Repository is not problem-scoped");
        }
        Team team = teamRepository.findById(repository.getTeamId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found"));
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(team.getEventId());
        ProblemScope scope = loadProblemScope(repository.getProblemId());
        ProblemRepositoryTemplate template = templateRepository.findByProblemId(repository.getProblemId())
                .filter(item -> Boolean.TRUE.equals(item.getEnabled()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Repository template is missing"));

        TeamRepository target = repository;
        if (target.getProvisionStatus() == RepositoryProvisionStatus.CREATED) {
            return RepositoryRetryResponse.builder()
                    .repository(toRepositoryResponse(target, true))
                    .build();
        }
        target.setCreatedBy(target.getCreatedBy() == null ? currentUserId : target.getCreatedBy());
        ProvisionOutcome outcome = provisionRepository(target, team, template, scope, OffsetDateTime.now());
        return RepositoryRetryResponse.builder()
                .repository(toRepositoryResponse(outcome.repository(), true))
                .build();
    }

    @Transactional(readOnly = true)
    public EventRepositoriesPageResponse getRepositoriesByEventPaged(
            Long eventId,
            Long roundId,
            Long boardId,
            RepositoryAccessStatus accessStatus,
            String q,
            int page,
            int size) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        int safeSize = Math.min(Math.max(size, 1), MAX_REPO_PAGE_SIZE);
        int safePage = Math.max(page, 0);
        String trimmedQuery = (q != null && !q.isBlank()) ? q.trim() : "";
        Pageable pageable = PageRequest.of(safePage, safeSize);
        Page<TeamRepository> pageResult = teamRepositoryEntityRepository.findByEventFiltered(
                eventId, roundId, boardId, accessStatus, trimmedQuery, pageable);
        RepositoryStatusStatsProjection summary = teamRepositoryEntityRepository.summarizeByEventFiltered(
                eventId, roundId, boardId, accessStatus, trimmedQuery);
        List<TeamRepositoryResponse> items = pageResult.getContent().stream()
                .map(repository -> toRepositoryResponse(repository, true))
                .toList();
        return EventRepositoriesPageResponse.builder()
                .items(items)
                .page(pageResult.getNumber())
                .size(pageResult.getSize())
                .total(pageResult.getTotalElements())
                .totalPages(pageResult.getTotalPages())
                .stats(toRepositoryStatusStats(summary))
                .build();
    }

    private RepositoryStatusStatsResponse toRepositoryStatusStats(RepositoryStatusStatsProjection summary) {
        if (summary == null) {
            return RepositoryStatusStatsResponse.builder().build();
        }
        return RepositoryStatusStatsResponse.builder()
                .total(summary.getTotal() == null ? 0L : summary.getTotal())
                .open(summary.getOpenCount() == null ? 0L : summary.getOpenCount())
                .closed(summary.getClosedCount() == null ? 0L : summary.getClosedCount())
                .pending(summary.getPendingCount() == null ? 0L : summary.getPendingCount())
                .failed(summary.getFailedCount() == null ? 0L : summary.getFailedCount())
                .created(summary.getCreatedCount() == null ? 0L : summary.getCreatedCount())
                .githubIssueCount(summary.getGithubIssueCount() == null ? 0L : summary.getGithubIssueCount())
                .build();
    }

    @Transactional(readOnly = true)
    public RepositoryStatusStatsResponse getEventRepositoryStats(Long eventId) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        return toRepositoryStatusStats(
                teamRepositoryEntityRepository.summarizeByEventFiltered(eventId, null, null, null, ""));
    }

    @Transactional(readOnly = true)
    public List<TeamRepositoryResponse> getTeamRepository(Long teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found"));
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(team.getEventId());
        return teamRepositoryEntityRepository.findAllByTeamId(teamId).stream()
                .map(repository -> toRepositoryResponse(repository, true))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TeamRepositoryResponse> getMyRepositories(Long currentUserId) {
        List<Long> teamIds = teamMemberRepository.findByUserId(currentUserId).stream()
                .map(TeamMember::getTeamId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (teamIds.isEmpty()) {
            return List.of();
        }
        return teamRepositoryEntityRepository.findByTeamIdInOrderByTeamIdAscProblemIdAsc(teamIds).stream()
                .map(repository -> toRepositoryResponse(repository, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TeamRepositoryResponse> getMyTeamRepository(Long teamId, Long currentUserId, Long eventId) {
        if (!teamMemberRepository.existsByTeamIdAndUserId(teamId, currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
        }

        CurrentRepositoryScope currentScope = resolveCurrentRepositoryScope(teamId, eventId);

        final Long preferredRoundId = currentScope.roundId();
        final Long preferredProblemId = currentScope.problemId();
        List<TeamRepository> repositories = new ArrayList<>(teamRepositoryEntityRepository.findAllByTeamId(teamId));
        repositories.sort((left, right) -> Integer.compare(
                repoSortPriority(right, preferredRoundId, preferredProblemId),
                repoSortPriority(left, preferredRoundId, preferredProblemId)));

        return repositories.stream()
                .map(repository -> toRepositoryResponse(
                        repository,
                        false,
                        isCurrentRepository(repository, preferredRoundId, preferredProblemId)))
                .toList();
    }

    private CurrentRepositoryScope resolveCurrentRepositoryScope(Long teamId, Long eventId) {
        if (eventId == null) {
            return CurrentRepositoryScope.empty();
        }
        BoardSlot bestSlot = null;
        Round bestRound = null;
        for (BoardSlot slot : boardSlotRepository.findByTeamId(teamId)) {
            if (slot.getRoundId() == null) {
                continue;
            }
            Round round = roundRepository.findById(slot.getRoundId()).orElse(null);
            if (round == null || !eventId.equals(round.getEventId())) {
                continue;
            }
            if (bestRound == null
                    || Comparator.nullsLast(Integer::compareTo)
                            .compare(round.getRoundOrder(), bestRound.getRoundOrder()) > 0) {
                bestSlot = slot;
                bestRound = round;
            }
        }
        if (bestSlot == null || bestRound == null) {
            return CurrentRepositoryScope.empty();
        }
        return new CurrentRepositoryScope(bestRound.getId(), resolvePrimaryProblemId(bestSlot.getBoardId()));
    }

    @Transactional
    public GrantJudgeAccessResponse grantJudgeAccessForRound(Long roundId) {
        Round round = roundRepository.findById(roundId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Round not found"));
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(round.getEventId());
        return grantJudgeAccessForRoundInternal(roundId);
    }

    private GrantJudgeAccessResponse grantJudgeAccessForRoundInternal(Long roundId) {
        if (!roundRepository.existsById(roundId)) {
            return GrantJudgeAccessResponse.builder()
                    .roundId(roundId)
                    .totalRepositories(0)
                    .totalJudges(0)
                    .grantedCount(0)
                    .failedCount(0)
                    .skippedCount(0)
                    .grants(List.of())
                    .build();
        }
        if (!StringUtils.hasText(githubOrg)) {
            return GrantJudgeAccessResponse.builder()
                    .roundId(roundId)
                    .totalRepositories(0)
                    .totalJudges(0)
                    .grantedCount(0)
                    .failedCount(0)
                    .skippedCount(0)
                    .grants(List.of())
                    .build();
        }

        List<Board> boards = boardRepository.findByRoundId(roundId);
        Map<Long, Set<Long>> judgesByBoard = new HashMap<>();
        Set<Long> uniqueJudgeIds = new LinkedHashSet<>();
        for (Board board : boards) {
            Set<Long> judgeIds = judgeAssignmentRepository.findByBoardId(board.getId()).stream()
                    .map(JudgeAssignment::getJudgeId)
                    .collect(Collectors.toCollection(LinkedHashSet::new));
            judgesByBoard.put(board.getId(), judgeIds);
            uniqueJudgeIds.addAll(judgeIds);
        }

        List<TeamRepository> repositories = teamRepositoryEntityRepository
                .findByRoundIdOrderByTeamIdAscProblemIdAsc(roundId).stream()
                .filter(repository -> repository.getProvisionStatus() == RepositoryProvisionStatus.CREATED)
                .filter(repository -> repository.getProblemId() != null)
                .filter(repository -> StringUtils.hasText(repository.getGithubOwner())
                        && StringUtils.hasText(repository.getGithubRepoName()))
                .toList();

        List<JudgeAccessGrantItem> grants = new ArrayList<>();
        int granted = 0;
        int failed = 0;
        int skipped = 0;

        for (TeamRepository repository : repositories) {
            Set<Long> judgeIds = judgesByBoard.getOrDefault(repository.getBoardId(), Set.of());
            String teamName = resolveTeamName(repository.getTeamId());
            for (Long judgeId : judgeIds) {
                User judge = userRepository.findById(judgeId).orElse(null);
                String judgeUsername = judge != null && StringUtils.hasText(judge.getGithubUsername())
                        ? judge.getGithubUsername().trim()
                        : null;
                if (!StringUtils.hasText(judgeUsername)) {
                    skipped++;
                    grants.add(JudgeAccessGrantItem.builder()
                            .repositoryId(repository.getId())
                            .teamId(repository.getTeamId())
                            .teamName(teamName)
                            .judgeId(judgeId)
                            .judgeUsername(null)
                            .access("READ")
                            .status("SKIPPED")
                            .error("MISSING_GITHUB_USERNAME")
                            .build());
                    continue;
                }
                if (judgeRepositoryAccessGrantRepository.existsByTeamRepositoryIdAndJudgeId(
                        repository.getId(), judgeId)) {
                    skipped++;
                    grants.add(JudgeAccessGrantItem.builder()
                            .repositoryId(repository.getId())
                            .teamId(repository.getTeamId())
                            .teamName(teamName)
                            .judgeId(judgeId)
                            .judgeUsername(judgeUsername)
                            .access("READ")
                            .status("SKIPPED")
                            .error("ALREADY_GRANTED")
                            .build());
                    continue;
                }
                if (hasGithubCollaboratorAccess(repository, judgeUsername)) {
                    persistJudgeAccessGrant(repository.getId(), judgeId, judgeUsername);
                    skipped++;
                    grants.add(JudgeAccessGrantItem.builder()
                            .repositoryId(repository.getId())
                            .teamId(repository.getTeamId())
                            .teamName(teamName)
                            .judgeId(judgeId)
                            .judgeUsername(judgeUsername)
                            .access("READ")
                            .status("SKIPPED")
                            .error("ALREADY_GRANTED")
                            .build());
                    continue;
                }
                try {
                    if (!githubRepositoryClient.userExists(judgeUsername)) {
                        failed++;
                        grants.add(JudgeAccessGrantItem.builder()
                                .repositoryId(repository.getId())
                                .teamId(repository.getTeamId())
                                .teamName(teamName)
                                .judgeId(judgeId)
                                .judgeUsername(judgeUsername)
                                .access("READ")
                                .status("FAILED")
                                .error("GITHUB_USERNAME_NOT_FOUND")
                                .build());
                        continue;
                    }
                } catch (GitHubClientException ex) {
                    failed++;
                    grants.add(JudgeAccessGrantItem.builder()
                            .repositoryId(repository.getId())
                            .teamId(repository.getTeamId())
                            .teamName(teamName)
                            .judgeId(judgeId)
                            .judgeUsername(judgeUsername)
                            .access("READ")
                            .status("FAILED")
                            .error(sanitizeError(ex.getMessage()))
                            .build());
                    continue;
                }
                try {
                    githubRepositoryClient.addCollaborator(
                            repository.getGithubOwner(),
                            repository.getGithubRepoName(),
                            judgeUsername,
                            "pull");
                    persistJudgeAccessGrant(repository.getId(), judgeId, judgeUsername);
                    granted++;
                    grants.add(JudgeAccessGrantItem.builder()
                            .repositoryId(repository.getId())
                            .teamId(repository.getTeamId())
                            .teamName(teamName)
                            .judgeId(judgeId)
                            .judgeUsername(judgeUsername)
                            .access("READ")
                            .status("GRANTED")
                            .build());
                } catch (GitHubClientException ex) {
                    failed++;
                    grants.add(JudgeAccessGrantItem.builder()
                            .repositoryId(repository.getId())
                            .teamId(repository.getTeamId())
                            .teamName(teamName)
                            .judgeId(judgeId)
                            .judgeUsername(judgeUsername)
                            .access("READ")
                            .status("FAILED")
                            .error(sanitizeError(ex.getMessage()))
                            .build());
                }
            }
        }

        return GrantJudgeAccessResponse.builder()
                .roundId(roundId)
                .totalRepositories(repositories.size())
                .totalJudges(uniqueJudgeIds.size())
                .grantedCount(granted)
                .failedCount(failed)
                .skippedCount(skipped)
                .grants(grants)
                .build();
    }

    @Transactional(readOnly = true)
    public List<JudgeRepositoryResponse> getJudgeRepositoriesForCurrentUser() {
        CurrentUserPrincipal principal = requireJudge();
        return getJudgeRepositories(principal.getUserId(), null);
    }

    @Transactional(readOnly = true)
    public List<JudgeRepositoryResponse> getJudgeRepositoriesForRoundForCurrentUser(Long roundId) {
        CurrentUserPrincipal principal = requireJudge();
        roundRepository.findById(roundId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Round not found"));
        return getJudgeRepositories(principal.getUserId(), roundId);
    }

    private List<JudgeRepositoryResponse> getJudgeRepositories(Long judgeId, Long roundIdFilter) {
        Set<Long> assignedBoardIds = judgeAssignmentRepository.findByJudgeId(judgeId).stream()
                .map(JudgeAssignment::getBoardId)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        if (assignedBoardIds.isEmpty()) {
            return List.of();
        }

        if (roundIdFilter != null) {
            assignedBoardIds = assignedBoardIds.stream()
                    .filter(boardId -> {
                        Board board = boardRepository.findById(boardId).orElse(null);
                        return board != null && Objects.equals(board.getRoundId(), roundIdFilter);
                    })
                    .collect(Collectors.toCollection(LinkedHashSet::new));
            if (assignedBoardIds.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "JUDGE_NOT_ASSIGNED_TO_ROUND");
            }
        }

        final Set<Long> boardIds = assignedBoardIds;
        Set<Long> teamIds = new LinkedHashSet<>();
        for (Long boardId : boardIds) {
            boardSlotRepository.findByBoardIdOrderByTeamNumberAsc(boardId).stream()
                    .map(BoardSlot::getTeamId)
                    .filter(Objects::nonNull)
                    .forEach(teamIds::add);
        }
        if (teamIds.isEmpty()) {
            return List.of();
        }

        User judge = userRepository.findById(judgeId).orElse(null);
        String judgeGithubUsername = judge != null ? judge.getGithubUsername() : null;
        boolean judgeHasGithubUsername = StringUtils.hasText(judgeGithubUsername);
        String normalizedJudgeGithub = judgeHasGithubUsername ? judgeGithubUsername.trim() : null;

        List<TeamRepository> repositories = teamRepositoryEntityRepository
                .findByTeamIdInOrderByTeamIdAscProblemIdAsc(List.copyOf(teamIds)).stream()
                .filter(repository -> repository.getProblemId() != null)
                .filter(repository -> boardIds.contains(repository.getBoardId()))
                .toList();
        Set<Long> repositoryIds = repositories.stream().map(TeamRepository::getId).collect(Collectors.toSet());
        Set<Long> grantedRepositoryIds = judgeRepositoryAccessGrantRepository
                .findByJudgeIdAndTeamRepositoryIdIn(judgeId, repositoryIds).stream()
                .map(JudgeRepositoryAccessGrant::getTeamRepositoryId)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        return repositories.stream()
                .map(repository -> toJudgeRepositoryResponse(
                        repository,
                        judgeId,
                        normalizedJudgeGithub,
                        judgeHasGithubUsername,
                        grantedRepositoryIds.contains(repository.getId())))
                .toList();
    }

    private ProvisionOutcome provisionRepository(
            TeamRepository repository,
            Team team,
            ProblemRepositoryTemplate template,
            ProblemScope scope,
            OffsetDateTime now) {
        List<String> usernames = loadConfirmedGithubUsernames(team.getId());
        if (usernames.isEmpty()) {
            String profileIssue = describeTeamGithubProfileIssue(team.getId());
            repository.setProvisionStatus(RepositoryProvisionStatus.FAILED);
            repository.setAccessStatus(RepositoryAccessStatus.FAILED);
            repository.setLastError(profileIssue != null
                    ? profileIssue
                    : "Missing GitHub username for confirmed team members");
            repository.setUpdatedAt(now);
            notificationService.notifyTeamGithubProfileIncomplete(team, profileIssue);
            return new ProvisionOutcome(teamRepositoryEntityRepository.save(repository), false, true);
        }
        if (!StringUtils.hasText(githubOrg)) {
            repository.setProvisionStatus(RepositoryProvisionStatus.FAILED);
            repository.setAccessStatus(RepositoryAccessStatus.FAILED);
            repository.setLastError("GitHub organization is not configured");
            repository.setUpdatedAt(now);
            return new ProvisionOutcome(teamRepositoryEntityRepository.save(repository), false, true);
        }
        try {
            List<String> missingGithubUsers = findMissingGithubUsers(usernames);
            if (!missingGithubUsers.isEmpty()) {
                String issue = "GitHub username không tồn tại: " + String.join(", ", missingGithubUsers);
                repository.setProvisionStatus(RepositoryProvisionStatus.FAILED);
                repository.setAccessStatus(RepositoryAccessStatus.FAILED);
                repository.setLastError(issue);
                repository.setUpdatedAt(now);
                notificationService.notifyTeamGithubProfileIncomplete(team, issue);
                return new ProvisionOutcome(teamRepositoryEntityRepository.save(repository), false, true);
            }
        } catch (GitHubClientException ex) {
            repository.setProvisionStatus(RepositoryProvisionStatus.FAILED);
            repository.setAccessStatus(RepositoryAccessStatus.FAILED);
            repository.setLastError(sanitizeError(ex.getMessage()));
            repository.setUpdatedAt(now);
            return new ProvisionOutcome(teamRepositoryEntityRepository.save(repository), false, true);
        }

        String repoName = buildRepositoryName(team, scope);
        repository.setGithubOwner(githubOrg.trim());
        repository.setGithubRepoName(repoName);
        repository.setRepositoryName(repoName);

        try {
            GitHubRepositoryInfo githubRepository = githubRepositoryClient
                    .getRepository(githubOrg.trim(), repoName)
                    .orElseGet(() -> githubRepositoryClient.createRepoFromTemplate(
                            template.getTemplateOwner(),
                            template.getTemplateRepo(),
                            githubOrg.trim(),
                            repoName,
                            true));
            for (String username : usernames) {
                githubRepositoryClient.addCollaborator(githubOrg.trim(), repoName, username, "push");
            }
            registerPushWebhookIfConfigured(githubOrg.trim(), repoName);
            repository.setGithubRepoId(githubRepository.getId());
            repository.setRepositoryUrl(githubRepository.getHtmlUrl());
            repository.setProvisionStatus(RepositoryProvisionStatus.CREATED);
            repository.setAccessStatus(RepositoryAccessStatus.OPEN);
            repository.setProvisionedAt(now);
            repository.setOpenedAt(now);
            repository.setNextReviewAt(now);
            repository.setStatus(SubmissionStatus.DRAFT);
            repository.setSubmittedAt(null);
            repository.setLastError(null);
            repository.setUpdatedAt(now);
            return new ProvisionOutcome(teamRepositoryEntityRepository.save(repository), true, false);
        } catch (GitHubClientException ex) {
            repository.setProvisionStatus(RepositoryProvisionStatus.FAILED);
            repository.setAccessStatus(RepositoryAccessStatus.FAILED);
            repository.setLastError(sanitizeError(ex.getMessage()));
            repository.setUpdatedAt(now);
            return new ProvisionOutcome(teamRepositoryEntityRepository.save(repository), false, true);
        }
    }

    private List<String> loadConfirmedGithubUsernames(Long teamId) {
        List<TeamMember> members = teamMemberRepository.findByTeamIdAndStatus(teamId, TeamMemberStatus.CONFIRMED);
        if (members.isEmpty()) {
            return List.of();
        }
        Set<String> usernames = new LinkedHashSet<>();
        for (TeamMember member : members) {
            if (member.getUserId() == null) {
                return List.of();
            }
            User user = userRepository.findById(member.getUserId()).orElse(null);
            if (user == null || !StringUtils.hasText(user.getGithubUsername())) {
                return List.of();
            }
            String normalized = AuthCredentialPolicy.normalizeUsername(user.getGithubUsername());
            if (normalized == null) {
                return List.of();
            }
            try {
                AuthCredentialPolicy.assertUsername(normalized);
            } catch (ResponseStatusException ex) {
                return List.of();
            }
            usernames.add(normalized);
        }
        return List.copyOf(usernames);
    }

    private String describeTeamGithubProfileIssue(Long teamId) {
        List<TeamMember> members = teamMemberRepository.findByTeamIdAndStatus(teamId, TeamMemberStatus.CONFIRMED);
        if (members.isEmpty()) {
            return "Team has no confirmed members";
        }
        List<String> issues = new ArrayList<>();
        for (TeamMember member : members) {
            if (member.getUserId() == null) {
                issues.add("Thành viên chưa liên kết tài khoản");
                continue;
            }
            User user = userRepository.findById(member.getUserId()).orElse(null);
            if (user == null) {
                issues.add("Không tìm thấy tài khoản thành viên");
                continue;
            }
            String label = StringUtils.hasText(user.getFullName()) ? user.getFullName() : user.getEmail();
            if (!StringUtils.hasText(user.getGithubUsername())) {
                issues.add(label + ": thiếu GitHub username");
                continue;
            }
            String normalized = AuthCredentialPolicy.normalizeUsername(user.getGithubUsername());
            if (normalized == null) {
                issues.add(label + ": GitHub username trống");
                continue;
            }
            try {
                AuthCredentialPolicy.assertUsername(normalized);
            } catch (ResponseStatusException ex) {
                issues.add(label + ": GitHub username không hợp lệ (" + normalized + ")");
            }
        }
        return issues.isEmpty() ? null : String.join("; ", issues);
    }

    private List<String> findMissingGithubUsers(List<String> usernames) {
        List<String> missing = new ArrayList<>();
        for (String username : usernames) {
            if (!githubRepositoryClient.userExists(username)) {
                missing.add(username);
            }
        }
        return missing;
    }

    private TeamRepository initializeRepository(Team team, ProblemScope scope, Long currentUserId, OffsetDateTime now) {
        return TeamRepository.builder()
                .teamId(team.getId())
                .roundId(scope.round().getId())
                .boardId(scope.board().getId())
                .problemId(scope.problem().getId())
                .reviewIntervalMinutes(DEFAULT_REVIEW_INTERVAL_MINUTES)
                .createdBy(currentUserId)
                .createdAt(now)
                .updatedAt(now)
                .status(SubmissionStatus.DRAFT)
                .accessStatus(RepositoryAccessStatus.PENDING)
                .provisionStatus(RepositoryProvisionStatus.PENDING)
                .build();
    }

    private ProblemScope loadProblemScope(Long problemId) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem not found"));
        Board board = boardRepository.findById(problem.getBoardId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Board not found"));
        Round round = roundRepository.findById(board.getRoundId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Round not found"));
        return new ProblemScope(problem, board, round);
    }

    private List<Team> findEligibleTeams(ProblemScope scope) {
        Set<Long> assignedTeamIds = boardSlotRepository.findByBoardId(scope.board().getId()).stream()
                .map(BoardSlot::getTeamId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (assignedTeamIds.isEmpty()) {
            return List.of();
        }
        return teamRepository.findByEventIdAndStatusOrderByNameAscIdAsc(scope.round().getEventId(), TeamStatus.CONFIRMED).stream()
                .filter(team -> assignedTeamIds.contains(team.getId()))
                .toList();
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

    private int repoSortPriority(TeamRepository repository, Long preferredRoundId, Long preferredProblemId) {
        if (preferredProblemId != null && preferredProblemId.equals(repository.getProblemId())) {
            return 100;
        }
        if (preferredRoundId != null && preferredRoundId.equals(repository.getRoundId())) {
            return 50;
        }
        return repository.getRoundId() != null ? 10 : 0;
    }

    private boolean isCurrentRepository(
            TeamRepository repository, Long preferredRoundId, Long preferredProblemId) {
        if (preferredProblemId != null && preferredProblemId.equals(repository.getProblemId())) {
            return true;
        }
        return preferredProblemId == null
                && preferredRoundId != null
                && preferredRoundId.equals(repository.getRoundId());
    }

    private String resolveRoundName(Long roundId) {
        if (roundId == null) {
            return null;
        }
        return roundRepository.findById(roundId).map(Round::getName).orElse(null);
    }

    private TeamRepositoryResponse toRepositoryResponse(TeamRepository repository, boolean exposeLastError) {
        return toRepositoryResponse(repository, exposeLastError, false);
    }

    private TeamRepositoryResponse toRepositoryResponse(
            TeamRepository repository, boolean exposeLastError, boolean currentRound) {
        return TeamRepositoryResponse.builder()
                .id(repository.getId())
                .teamId(repository.getTeamId())
                .teamName(resolveTeamName(repository.getTeamId()))
                .roundId(repository.getRoundId())
                .roundName(resolveRoundName(repository.getRoundId()))
                .currentRound(currentRound)
                .boardId(repository.getBoardId())
                .problemId(repository.getProblemId())
                .repositoryUrl(repository.getRepositoryUrl())
                .repositoryName(repository.getRepositoryName())
                .githubOwner(repository.getGithubOwner())
                .githubRepoName(repository.getGithubRepoName())
                .githubRepoId(repository.getGithubRepoId())
                .accessStatus(resolveAccessStatus(repository))
                .provisionStatus(repository.getProvisionStatus())
                .submissionStatus(resolveSubmissionStatus(repository))
                .submittedAt(com.seal.hackathon.common.util.SubmissionLifecycle.effectiveSubmittedAt(
                        repository, resolveProblemCloseAt(repository.getProblemId())))
                .openedAt(repository.getOpenedAt())
                .closedAt(repository.getClosedAt())
                .provisionedAt(repository.getProvisionedAt())
                .lastPushAt(repository.getLastPushAt())
                .lastError(exposeLastError ? repository.getLastError() : null)
                .createdAt(repository.getCreatedAt())
                .updatedAt(repository.getUpdatedAt())
                .latestCommit(repoCommitService.findLatestResponse(repository.getId()).orElse(null))
                .build();
    }

    private RepoTemplateResponse toTemplateResponse(ProblemRepositoryTemplate template) {
        return RepoTemplateResponse.builder()
                .id(template.getId())
                .problemId(template.getProblemId())
                .templateOwner(template.getTemplateOwner())
                .templateRepo(template.getTemplateRepo())
                .defaultBranch(template.getDefaultBranch())
                .enabled(template.getEnabled())
                .createdBy(template.getCreatedBy())
                .createdAt(template.getCreatedAt())
                .updatedAt(template.getUpdatedAt())
                .build();
    }

    private SubmissionStatus resolveSubmissionStatus(TeamRepository repository) {
        return com.seal.hackathon.common.util.SubmissionLifecycle.effectiveStatus(
                repository, resolveProblemCloseAt(repository.getProblemId()));
    }

    private RepositoryAccessStatus resolveAccessStatus(TeamRepository repository) {
        OffsetDateTime closeAt = resolveProblemCloseAt(repository.getProblemId());
        if (repository.getAccessStatus() == RepositoryAccessStatus.OPEN
                && com.seal.hackathon.common.util.SubmissionLifecycle.isDeadlinePassed(closeAt)
                && com.seal.hackathon.common.util.SubmissionLifecycle.hasSubmittableContent(repository)) {
            return RepositoryAccessStatus.CLOSED;
        }
        return repository.getAccessStatus();
    }

    private OffsetDateTime resolveProblemCloseAt(Long problemId) {
        if (problemId == null) {
            return null;
        }
        return problemRepository.findById(problemId).map(Problem::getCloseAt).orElse(null);
    }

    private void finalizeSubmissionAtClose(
            TeamRepository repository, OffsetDateTime problemCloseAt, OffsetDateTime now) {
        com.seal.hackathon.common.util.SubmissionLifecycle.finalizeAtClose(repository, problemCloseAt, now);
        if (repository.getStatus() == SubmissionStatus.SUBMITTED) {
            repoCommitService.captureLatestCommitSilently(repository.getId());
        }
    }

    private String resolveTeamName(Long teamId) {
        if (teamId == null) {
            return null;
        }
        return teamRepository.findById(teamId).map(Team::getName).orElse(null);
    }

    private JudgeRepositoryResponse toJudgeRepositoryResponse(
            TeamRepository repository,
            Long judgeId,
            String judgeGithubUsername,
            boolean judgeHasGithubUsername,
            boolean accessGrantedByRecord) {
        Problem problem = repository.getProblemId() == null
                ? null
                : problemRepository.findById(repository.getProblemId()).orElse(null);
        Board board = repository.getBoardId() == null
                ? null
                : boardRepository.findById(repository.getBoardId()).orElse(null);
        return JudgeRepositoryResponse.builder()
                .id(repository.getId())
                .teamId(repository.getTeamId())
                .teamName(resolveTeamName(repository.getTeamId()))
                .roundId(repository.getRoundId())
                .boardId(repository.getBoardId())
                .boardName(board != null ? board.getName() : null)
                .problemId(repository.getProblemId())
                .problemTitle(problem != null ? problem.getTitle() : null)
                .repositoryUrl(repository.getRepositoryUrl())
                .cloneUrl(buildCloneUrl(repository.getRepositoryUrl()))
                .repositoryName(repository.getRepositoryName())
                .githubOwner(repository.getGithubOwner())
                .githubRepoName(repository.getGithubRepoName())
                .accessStatus(repository.getAccessStatus())
                .provisionStatus(repository.getProvisionStatus())
                .submissionStatus(resolveSubmissionStatus(repository))
                .submittedAt(com.seal.hackathon.common.util.SubmissionLifecycle.effectiveSubmittedAt(
                        repository, resolveProblemCloseAt(repository.getProblemId())))
                .openedAt(repository.getOpenedAt())
                .closedAt(repository.getClosedAt())
                .provisionedAt(repository.getProvisionedAt())
                .lastPushAt(repository.getLastPushAt())
                .judgeGithubUsername(judgeGithubUsername)
                .judgeHasGithubUsername(judgeHasGithubUsername)
                .judgeGithubAccessGranted(resolveJudgeGithubAccessGranted(
                        repository, judgeId, judgeGithubUsername, judgeHasGithubUsername, accessGrantedByRecord))
                .build();
    }

    private Boolean resolveJudgeGithubAccessGranted(
            TeamRepository repository,
            Long judgeId,
            String judgeGithubUsername,
            boolean judgeHasGithubUsername,
            boolean accessGrantedByRecord) {
        if (!judgeHasGithubUsername
                || repository.getProvisionStatus() != RepositoryProvisionStatus.CREATED
                || !StringUtils.hasText(repository.getGithubOwner())
                || !StringUtils.hasText(repository.getGithubRepoName())) {
            return null;
        }
        if (accessGrantedByRecord
                || (judgeId != null
                        && judgeRepositoryAccessGrantRepository.existsByTeamRepositoryIdAndJudgeId(
                                repository.getId(), judgeId))) {
            return true;
        }
        try {
            return githubRepositoryClient
                    .getCollaboratorPermission(
                            repository.getGithubOwner(),
                            repository.getGithubRepoName(),
                            judgeGithubUsername)
                    .map(this::isReadAccessPermission)
                    .orElse(false);
        } catch (GitHubClientException ex) {
            return null;
        }
    }

    private boolean hasGithubCollaboratorAccess(TeamRepository repository, String judgeGithubUsername) {
        if (!StringUtils.hasText(judgeGithubUsername)
                || !StringUtils.hasText(repository.getGithubOwner())
                || !StringUtils.hasText(repository.getGithubRepoName())) {
            return false;
        }
        try {
            return githubRepositoryClient
                    .getCollaboratorPermission(
                            repository.getGithubOwner(),
                            repository.getGithubRepoName(),
                            judgeGithubUsername)
                    .map(this::isReadAccessPermission)
                    .orElse(false);
        } catch (GitHubClientException ex) {
            return false;
        }
    }

    private boolean isProblemFullyProvisioned(Long problemId) {
        ProblemScope scope = loadProblemScope(problemId);
        List<Team> eligibleTeams = findEligibleTeams(scope);
        if (eligibleTeams.isEmpty()) {
            return true;
        }
        for (Team team : eligibleTeams) {
            TeamRepository repository = teamRepositoryEntityRepository
                    .findByTeamIdAndProblemId(team.getId(), problemId)
                    .orElse(null);
            if (repository == null || repository.getProvisionStatus() != RepositoryProvisionStatus.CREATED) {
                return false;
            }
        }
        return true;
    }

    private void persistJudgeAccessGrant(Long teamRepositoryId, Long judgeId, String judgeGithubUsername) {
        if (judgeRepositoryAccessGrantRepository.existsByTeamRepositoryIdAndJudgeId(teamRepositoryId, judgeId)) {
            return;
        }
        judgeRepositoryAccessGrantRepository.save(JudgeRepositoryAccessGrant.builder()
                .teamRepositoryId(teamRepositoryId)
                .judgeId(judgeId)
                .judgeGithubUsername(judgeGithubUsername)
                .grantedAt(OffsetDateTime.now())
                .build());
    }

    private boolean hasPendingJudgeGrantsForRound(Long roundId) {
        if (roundId == null || !roundRepository.existsById(roundId)) {
            return false;
        }
        List<Board> boards = boardRepository.findByRoundId(roundId);
        Map<Long, Set<Long>> judgesByBoard = new HashMap<>();
        for (Board board : boards) {
            Set<Long> judgeIds = judgeAssignmentRepository.findByBoardId(board.getId()).stream()
                    .map(JudgeAssignment::getJudgeId)
                    .collect(Collectors.toCollection(LinkedHashSet::new));
            judgesByBoard.put(board.getId(), judgeIds);
        }
        List<TeamRepository> repositories = teamRepositoryEntityRepository
                .findByRoundIdOrderByTeamIdAscProblemIdAsc(roundId).stream()
                .filter(repository -> repository.getProvisionStatus() == RepositoryProvisionStatus.CREATED)
                .filter(repository -> repository.getProblemId() != null)
                .filter(repository -> StringUtils.hasText(repository.getGithubOwner())
                        && StringUtils.hasText(repository.getGithubRepoName()))
                .toList();
        for (TeamRepository repository : repositories) {
            Set<Long> judgeIds = judgesByBoard.getOrDefault(repository.getBoardId(), Set.of());
            for (Long judgeId : judgeIds) {
                if (!judgeRepositoryAccessGrantRepository.existsByTeamRepositoryIdAndJudgeId(
                        repository.getId(), judgeId)) {
                    return true;
                }
            }
        }
        return false;
    }

    private String resolveRepositoryBranch(TeamRepository repository) {
        if (repository != null && repository.getProblemId() != null) {
            return templateRepository.findByProblemId(repository.getProblemId())
                    .map(ProblemRepositoryTemplate::getDefaultBranch)
                    .filter(StringUtils::hasText)
                    .map(String::trim)
                    .orElse(defaultBranch());
        }
        return defaultBranch();
    }

    private boolean isReadAccessPermission(String permission) {
        if (!StringUtils.hasText(permission)) {
            return false;
        }
        return switch (permission.trim().toLowerCase()) {
            case "pull", "triage", "push", "maintain", "admin" -> true;
            default -> false;
        };
    }

    private String buildCloneUrl(String repositoryUrl) {
        if (!StringUtils.hasText(repositoryUrl)) {
            return null;
        }
        String trimmed = repositoryUrl.trim();
        if (trimmed.endsWith(".git")) {
            return trimmed;
        }
        return trimmed + ".git";
    }

    private CurrentUserPrincipal requireJudge() {
        CurrentUserPrincipal principal = currentUserProvider.getCurrentUser();
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
        }
        if (principal.getRoles() == null || !principal.getRoles().contains("JUDGE")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ONLY_JUDGE");
        }
        return principal;
    }

    private String buildRepositoryName(Team team, ProblemScope scope) {
        Event event = eventRepository.findById(scope.round().getEventId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        return GitHubRepositoryNameSlug.build(
                event.getName(),
                team.getName(),
                scope.problem().getTitle());
    }

    private String defaultBranch() {
        return StringUtils.hasText(configuredDefaultBranch) ? configuredDefaultBranch.trim() : "main";
    }

    private SaveRepoTemplateRequest defaultTemplateRequest() {
        String owner = resolveConfiguredTemplateOwner();
        String repo = StringUtils.hasText(configuredTemplateRepo) ? configuredTemplateRepo.trim() : null;
        if (!StringUtils.hasText(owner) || !StringUtils.hasText(repo)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Repository template not found. Configure GITHUB_TEMPLATE_OWNER and GITHUB_TEMPLATE_REPO.");
        }
        SaveRepoTemplateRequest request = new SaveRepoTemplateRequest();
        request.setTemplateOwner(owner);
        request.setTemplateRepo(repo);
        request.setDefaultBranch(defaultBranch());
        request.setEnabled(true);
        return request;
    }

    private String resolveConfiguredTemplateOwner() {
        if (StringUtils.hasText(configuredTemplateOwner)) {
            return configuredTemplateOwner.trim();
        }
        if (StringUtils.hasText(githubOrg)) {
            return githubOrg.trim();
        }
        return null;
    }

    private String normalizeRequired(String value, String message) {
        if (!StringUtils.hasText(value)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return value.trim();
    }

    private void registerPushWebhookIfConfigured(String owner, String repo) {
        if (!webhookAutoRegister || !webhookReviewEnabled) {
            return;
        }
        String payloadUrl = resolveWebhookPayloadUrl();
        if (!StringUtils.hasText(payloadUrl) || !StringUtils.hasText(webhookSecret)) {
            log.debug(
                    "Skipping GitHub push webhook for {}/{}: configure GITHUB_WEBHOOK_SECRET and GITHUB_WEBHOOK_URL (or MAIL_API_BASE_URL)",
                    owner,
                    repo);
            return;
        }
        try {
            githubRepositoryClient.ensurePushWebhook(owner, repo, payloadUrl, webhookSecret.trim());
            log.info("Ensured GitHub push webhook for {}/{} -> {}", owner, repo, payloadUrl);
        } catch (GitHubClientException ex) {
            log.warn(
                    "Failed to register GitHub push webhook for {}/{}: {}",
                    owner,
                    repo,
                    sanitizeError(ex.getMessage()));
        } catch (RuntimeException ex) {
            log.warn(
                    "Failed to register GitHub push webhook for {}/{}: {}",
                    owner,
                    repo,
                    sanitizeError(ex.getMessage()));
        }
    }

    private String resolveWebhookPayloadUrl() {
        if (StringUtils.hasText(configuredWebhookUrl)) {
            return stripTrailingSlash(configuredWebhookUrl.trim());
        }
        if (!StringUtils.hasText(mailApiBaseUrl)) {
            return null;
        }
        return stripTrailingSlash(mailApiBaseUrl.trim()) + "/api/v1/webhooks/github";
    }

    private String stripTrailingSlash(String value) {
        String trimmed = value;
        while (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
    }

    private String sanitizeError(String value) {
        if (!StringUtils.hasText(value)) {
            return "GitHub operation failed";
        }
        String sanitized = value.replaceAll("(?i)(token|bearer|pat|private[_ -]?key)\\s*[:=]\\s*\\S+", "$1=[redacted]");
        return sanitized.length() > 500 ? sanitized.substring(0, 500) : sanitized;
    }

    private record ProblemScope(Problem problem, Board board, Round round) {
    }

    private record ProvisionOutcome(TeamRepository repository, boolean created, boolean failed) {
    }

    private record LockBatchResult(int locked, int failed, List<TeamRepositoryResponse> responses) {
    }

    private record CurrentRepositoryScope(Long roundId, Long problemId) {
        private static CurrentRepositoryScope empty() {
            return new CurrentRepositoryScope(null, null);
        }
    }
}
