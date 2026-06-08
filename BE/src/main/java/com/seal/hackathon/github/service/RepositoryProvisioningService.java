package com.seal.hackathon.github.service;

import com.seal.hackathon.aireview.entity.TeamRepository;
import com.seal.hackathon.aireview.repository.TeamRepositoryEntityRepository;
import com.seal.hackathon.authprofile.entity.User;
import com.seal.hackathon.authprofile.repository.UserRepository;
import com.seal.hackathon.common.enums.RepositoryAccessStatus;
import com.seal.hackathon.common.enums.RepositoryProvisionStatus;
import com.seal.hackathon.common.enums.SubmissionStatus;
import com.seal.hackathon.common.enums.TeamMemberStatus;
import com.seal.hackathon.common.enums.TeamStatus;
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
import com.seal.hackathon.github.dto.ProvisionProblemRepositoriesResponse;
import com.seal.hackathon.github.dto.RepoTemplateResponse;
import com.seal.hackathon.github.dto.RepositoryLockResponse;
import com.seal.hackathon.github.dto.RepositoryRetryResponse;
import com.seal.hackathon.github.dto.SaveRepoTemplateRequest;
import com.seal.hackathon.github.dto.TeamRepositoryResponse;
import com.seal.hackathon.github.entity.ProblemRepositoryTemplate;
import com.seal.hackathon.github.repository.ProblemRepositoryTemplateRepository;
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.entity.TeamMember;
import com.seal.hackathon.registration.repository.TeamMemberRepository;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
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

    @Value("${app.github.org:}")
    private String githubOrg;

    @Value("${app.github.default-branch:main}")
    private String configuredDefaultBranch;

    @Transactional
    public RepoTemplateResponse saveProblemTemplate(
            Long problemId,
            SaveRepoTemplateRequest request,
            Long currentUserId) {
        problemRepository.findById(problemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem not found"));
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

    @Transactional(readOnly = true)
    public RepoTemplateResponse getProblemTemplate(Long problemId) {
        return templateRepository.findByProblemId(problemId)
                .map(this::toTemplateResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Repository template not found"));
    }

    @Transactional
    public ProvisionProblemRepositoriesResponse provisionForProblem(Long problemId, boolean force, Long currentUserId) {
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
    public RepositoryLockResponse lockRoundRepositories(Long roundId) {
        Round round = roundRepository.findById(roundId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Round not found"));
        OffsetDateTime now = OffsetDateTime.now();
        if (round.getEndAt() == null || now.isBefore(round.getEndAt())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Round has not ended yet");
        }

        List<TeamRepository> repositories = teamRepositoryEntityRepository
                .findByRoundIdAndAccessStatus(roundId, RepositoryAccessStatus.OPEN);
        List<TeamRepositoryResponse> responses = new ArrayList<>();
        int locked = 0;
        int failed = 0;

        for (TeamRepository repository : repositories) {
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

        return RepositoryLockResponse.builder()
                .roundId(roundId)
                .totalRepositories(repositories.size())
                .lockedCount(locked)
                .failedCount(failed)
                .repositories(responses)
                .build();
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
        teamRepository.findById(teamId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found"));
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
    public List<TeamRepositoryResponse> getMyTeamRepository(Long teamId, Long currentUserId) {
        if (!teamMemberRepository.existsByTeamIdAndUserId(teamId, currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
        }
        return teamRepositoryEntityRepository.findAllByTeamId(teamId).stream()
                .map(repository -> toRepositoryResponse(repository, false))
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

        String repoName = deterministicRepositoryName(scope.round().getEventId(), team.getId(), scope.problem().getId());
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

    private TeamRepositoryResponse toRepositoryResponse(TeamRepository repository, boolean exposeLastError) {
        return TeamRepositoryResponse.builder()
                .id(repository.getId())
                .teamId(repository.getTeamId())
                .teamName(resolveTeamName(repository.getTeamId()))
                .roundId(repository.getRoundId())
                .boardId(repository.getBoardId())
                .problemId(repository.getProblemId())
                .repositoryUrl(repository.getRepositoryUrl())
                .repositoryName(repository.getRepositoryName())
                .githubOwner(repository.getGithubOwner())
                .githubRepoName(repository.getGithubRepoName())
                .githubRepoId(repository.getGithubRepoId())
                .accessStatus(repository.getAccessStatus())
                .provisionStatus(repository.getProvisionStatus())
                .openedAt(repository.getOpenedAt())
                .closedAt(repository.getClosedAt())
                .provisionedAt(repository.getProvisionedAt())
                .lastError(exposeLastError ? repository.getLastError() : null)
                .createdAt(repository.getCreatedAt())
                .updatedAt(repository.getUpdatedAt())
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

    private String resolveTeamName(Long teamId) {
        if (teamId == null) {
            return null;
        }
        return teamRepository.findById(teamId).map(Team::getName).orElse(null);
    }

    private String deterministicRepositoryName(Long eventId, Long teamId, Long problemId) {
        return "seal-event-" + eventId + "-team-" + teamId + "-problem-" + problemId;
    }

    private String defaultBranch() {
        return StringUtils.hasText(configuredDefaultBranch) ? configuredDefaultBranch.trim() : "main";
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
}
