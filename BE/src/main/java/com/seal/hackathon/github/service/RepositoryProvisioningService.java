package com.seal.hackathon.github.service;

import com.seal.hackathon.aireview.entity.TeamRepository;
import com.seal.hackathon.aireview.repository.TeamRepositoryEntityRepository;
import com.seal.hackathon.assignment.entity.JudgeAssignment;
import com.seal.hackathon.assignment.repository.JudgeAssignmentRepository;
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
import com.seal.hackathon.contest.dto.MyBoardResponse;
import com.seal.hackathon.contest.entity.Board;
import com.seal.hackathon.contest.entity.BoardSlot;
import com.seal.hackathon.contest.entity.Problem;
import com.seal.hackathon.contest.entity.Round;
import com.seal.hackathon.contest.service.ContestManagementService;
import com.seal.hackathon.contest.repository.BoardRepository;
import com.seal.hackathon.contest.repository.BoardSlotRepository;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.contest.repository.ProblemRepository;
import com.seal.hackathon.contest.repository.RoundRepository;
import com.seal.hackathon.github.client.GitHubClientException;
import com.seal.hackathon.github.client.GitHubRepositoryClient;
import com.seal.hackathon.github.client.GitHubRepositoryInfo;
import com.seal.hackathon.github.dto.GrantJudgeAccessResponse;
import com.seal.hackathon.github.dto.JudgeAccessGrantItem;
import com.seal.hackathon.github.dto.JudgeRepositoryResponse;
import com.seal.hackathon.github.dto.ProvisionProblemRepositoriesResponse;
import com.seal.hackathon.github.dto.RepoTemplateResponse;
import com.seal.hackathon.github.dto.RepositoryLockResponse;
import com.seal.hackathon.github.dto.RepositoryRetryResponse;
import com.seal.hackathon.github.dto.SaveRepoTemplateRequest;
import com.seal.hackathon.github.dto.TeamRepositoryResponse;
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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class RepositoryProvisioningService {

    private static final int DEFAULT_REVIEW_INTERVAL_MINUTES = 30;

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
    private final ContestManagementService contestManagementService;
    private final RepoCommitService repoCommitService;

    @Value("${app.github.org:}")
    private String githubOrg;

    @Value("${app.github.template-owner:}")
    private String configuredTemplateOwner;

    @Value("${app.github.template-repo:}")
    private String configuredTemplateRepo;

    @Value("${app.github.default-branch:main}")
    private String configuredDefaultBranch;

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
        return provisionForProblemInternal(problemId, force, currentUserId);
    }

    private ProvisionProblemRepositoriesResponse provisionForProblemInternal(
            Long problemId, boolean force, Long currentUserId) {
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
        if (locked > 0) {
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
        int createdTotal = 0;
        for (ProblemRepositoryTemplate template : templateRepository.findByEnabledTrue()) {
            Problem problem = problemRepository.findById(template.getProblemId()).orElse(null);
            if (problem == null || problem.getReleaseAt() == null || now.isBefore(problem.getReleaseAt())) {
                continue;
            }
            ProvisionProblemRepositoriesResponse result = provisionForProblemInternal(
                    problem.getId(), false, null);
            createdTotal += result.getCreatedCount();
        }
        return createdTotal;
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
            grantJudgeAccessForRoundInternal(roundId);
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
        for (TeamRepository repository : teamRepositoryEntityRepository.findAllByTeamId(teamId)) {
            if (repository.getAccessStatus() != RepositoryAccessStatus.OPEN || repository.getProblemId() == null) {
                continue;
            }
            Problem problem = problemRepository.findById(repository.getProblemId()).orElse(null);
            if (problem == null || problem.getCloseAt() == null || now.isBefore(problem.getCloseAt())) {
                continue;
            }
            lockOpenRepositories(List.of(repository), now);
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
    public List<TeamRepositoryResponse> getRepositoriesByEvent(Long eventId) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        List<Long> teamIds = teamRepository.findByEventId(eventId).stream()
                .map(Team::getId)
                .toList();
        if (teamIds.isEmpty()) {
            return List.of();
        }
        return teamRepositoryEntityRepository.findByTeamIdInOrderByTeamIdAscProblemIdAsc(teamIds).stream()
                .map(repository -> toRepositoryResponse(repository, true))
                .toList();
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

    @Transactional
    public List<TeamRepositoryResponse> getMyTeamRepository(Long teamId, Long currentUserId, Long eventId) {
        if (!teamMemberRepository.existsByTeamIdAndUserId(teamId, currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
        }
        closeExpiredRepositoriesForTeam(teamId);

        Long currentRoundId = null;
        Long currentProblemId = null;
        if (eventId != null) {
            MyBoardResponse board = contestManagementService.getMyBoard(eventId, currentUserId);
            if (board.isAssigned()) {
                currentRoundId = board.getRoundId();
                currentProblemId = resolvePrimaryProblemId(board.getBoardId());
            }
        }

        final Long preferredRoundId = currentRoundId;
        final Long preferredProblemId = currentProblemId;
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
                try {
                    githubRepositoryClient.addCollaborator(
                            repository.getGithubOwner(),
                            repository.getGithubRepoName(),
                            judgeUsername,
                            "pull");
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

        return teamRepositoryEntityRepository.findByTeamIdInOrderByTeamIdAscProblemIdAsc(List.copyOf(teamIds)).stream()
                .filter(repository -> repository.getProblemId() != null)
                .filter(repository -> boardIds.contains(repository.getBoardId()))
                .map(repository -> toJudgeRepositoryResponse(repository, normalizedJudgeGithub, judgeHasGithubUsername))
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
            repository.setProvisionStatus(RepositoryProvisionStatus.FAILED);
            repository.setAccessStatus(RepositoryAccessStatus.FAILED);
            repository.setLastError("Missing GitHub username for confirmed team members");
            repository.setUpdatedAt(now);
            return new ProvisionOutcome(teamRepositoryEntityRepository.save(repository), false, true);
        }
        if (!StringUtils.hasText(githubOrg)) {
            repository.setProvisionStatus(RepositoryProvisionStatus.FAILED);
            repository.setAccessStatus(RepositoryAccessStatus.FAILED);
            repository.setLastError("GitHub organization is not configured");
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
            repository.setGithubRepoId(githubRepository.getId());
            repository.setRepositoryUrl(githubRepository.getHtmlUrl());
            repository.setProvisionStatus(RepositoryProvisionStatus.CREATED);
            repository.setAccessStatus(RepositoryAccessStatus.OPEN);
            repository.setProvisionedAt(now);
            repository.setOpenedAt(now);
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
            usernames.add(user.getGithubUsername().trim());
        }
        return List.copyOf(usernames);
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
        return teamRepository.findByEventIdAndStatus(scope.round().getEventId(), TeamStatus.CONFIRMED).stream()
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
                .accessStatus(repository.getAccessStatus())
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
            TeamRepository repository, String judgeGithubUsername, boolean judgeHasGithubUsername) {
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
                        repository, judgeGithubUsername, judgeHasGithubUsername))
                .build();
    }

    private Boolean resolveJudgeGithubAccessGranted(
            TeamRepository repository, String judgeGithubUsername, boolean judgeHasGithubUsername) {
        if (!judgeHasGithubUsername
                || repository.getProvisionStatus() != RepositoryProvisionStatus.CREATED
                || !StringUtils.hasText(repository.getGithubOwner())
                || !StringUtils.hasText(repository.getGithubRepoName())) {
            return null;
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
}
