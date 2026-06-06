package com.seal.hackathon.submission.service;

import com.seal.hackathon.aireview.repository.TeamRepositoryEntityRepository;
import com.seal.hackathon.authprofile.security.CurrentUserPrincipal;
import com.seal.hackathon.authprofile.security.CurrentUserProvider;
import com.seal.hackathon.common.enums.SubmissionStatus;
import com.seal.hackathon.contest.dto.MyBoardResponse;
import com.seal.hackathon.contest.dto.MyProblemResponse;
import com.seal.hackathon.contest.entity.Board;
import com.seal.hackathon.contest.entity.BoardSlot;
import com.seal.hackathon.contest.entity.Event;
import com.seal.hackathon.contest.entity.Problem;
import com.seal.hackathon.contest.entity.Round;
import com.seal.hackathon.contest.repository.BoardRepository;
import com.seal.hackathon.contest.repository.BoardSlotRepository;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.contest.repository.ProblemRepository;
import com.seal.hackathon.contest.repository.RoundRepository;
import com.seal.hackathon.contest.service.ContestManagementService;
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.repository.TeamRepository;
import com.seal.hackathon.submission.dto.AdminTeamSubmissionResponse;
import com.seal.hackathon.notification.service.NotificationService;
import com.seal.hackathon.submission.dto.SaveSubmissionDraftRequest;
import com.seal.hackathon.submission.dto.SubmissionResponse;
import com.seal.hackathon.submission.dto.SubmitSubmissionRequest;
import java.net.URI;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class SubmissionService {

    private static final int DEFAULT_REVIEW_INTERVAL_MINUTES = 30;

    private final ContestManagementService contestManagementService;
    private final TeamRepositoryEntityRepository teamRepositoryEntityRepository;
    private final TeamRepository teamRepository;
    private final EventRepository eventRepository;
    private final RoundRepository roundRepository;
    private final BoardRepository boardRepository;
    private final BoardSlotRepository boardSlotRepository;
    private final ProblemRepository problemRepository;
    private final CurrentUserProvider currentUserProvider;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<AdminTeamSubmissionResponse> listSubmissionsForOrganizer(Long eventId, Long boardId) {
        CurrentUserPrincipal principal = requireOrganizer();
        assertOrganizerOwnsEvent(principal, eventId);

        Map<Long, BoardSlot> slotByTeamId = new HashMap<>();
        Map<Long, Board> boardById = new HashMap<>();

        if (boardId != null) {
            Board board = boardRepository.findById(boardId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "BOARD_NOT_FOUND"));
            Round round = roundRepository.findById(board.getRoundId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ROUND_NOT_FOUND"));
            if (!eventId.equals(round.getEventId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "BOARD_EVENT_MISMATCH");
            }
            boardById.put(board.getId(), board);
            for (BoardSlot slot : boardSlotRepository.findByBoardId(boardId)) {
                if (slot.getTeamId() != null) {
                    slotByTeamId.put(slot.getTeamId(), slot);
                }
            }
        } else {
            for (Round round : roundRepository.findByEventId(eventId)) {
                for (BoardSlot slot : boardSlotRepository.findByRoundId(round.getId())) {
                    if (slot.getTeamId() != null) {
                        slotByTeamId.putIfAbsent(slot.getTeamId(), slot);
                        if (slot.getBoardId() != null && !boardById.containsKey(slot.getBoardId())) {
                            boardRepository.findById(slot.getBoardId()).ifPresent(b -> boardById.put(b.getId(), b));
                        }
                    }
                }
            }
        }

        List<AdminTeamSubmissionResponse> results = new ArrayList<>();
        for (Map.Entry<Long, BoardSlot> entry : slotByTeamId.entrySet()) {
            Long teamId = entry.getKey();
            BoardSlot slot = entry.getValue();
            Team team = teamRepository.findById(teamId).orElse(null);
            if (team == null) {
                continue;
            }
            com.seal.hackathon.aireview.entity.TeamRepository repo =
                    teamRepositoryEntityRepository.findByTeamId(teamId).orElse(null);
            Board board = slot.getBoardId() != null ? boardById.get(slot.getBoardId()) : null;
            results.add(AdminTeamSubmissionResponse.builder()
                    .teamId(teamId)
                    .teamName(team.getName())
                    .boardId(slot.getBoardId())
                    .boardName(board != null ? board.getName() : null)
                    .slotNumber(slot.getTeamNumber())
                    .status(repo != null ? repo.getStatus() : null)
                    .repositoryUrl(repo != null ? repo.getRepositoryUrl() : null)
                    .repositoryName(repo != null ? repo.getRepositoryName() : null)
                    .submittedAt(repo != null ? repo.getSubmittedAt() : null)
                    .build());
        }

        results.sort(Comparator
                .comparing(AdminTeamSubmissionResponse::getBoardName, Comparator.nullsLast(String::compareToIgnoreCase))
                .thenComparing(AdminTeamSubmissionResponse::getSlotNumber, Comparator.nullsLast(Integer::compareTo))
                .thenComparing(AdminTeamSubmissionResponse::getTeamName, Comparator.nullsLast(String::compareToIgnoreCase)));
        return results;
    }

    @Transactional(readOnly = true)
    public SubmissionResponse getSubmissionForOrganizer(Long teamId) {
        CurrentUserPrincipal principal = requireOrganizer();
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "TEAM_NOT_FOUND"));
        assertOrganizerOwnsEvent(principal, team.getEventId());

        com.seal.hackathon.aireview.entity.TeamRepository entity =
                teamRepositoryEntityRepository.findByTeamId(teamId).orElse(null);
        OffsetDateTime deadline = resolveDeadlineForTeam(teamId, team.getEventId());
        return buildAdminResponse(team, entity, deadline);
    }

    @Transactional(readOnly = true)
    public SubmissionResponse getSubmission(Long eventId, Long userId) {
        SubmissionContext ctx = resolveContext(eventId, userId);
        com.seal.hackathon.aireview.entity.TeamRepository entity = ctx.teamId() == null
                ? null
                : teamRepositoryEntityRepository.findByTeamId(ctx.teamId()).orElse(null);
        return buildResponse(ctx, entity);
    }

    @Transactional
    public SubmissionResponse saveDraft(Long userId, SaveSubmissionDraftRequest request) {
        SubmissionContext ctx = resolveContext(request.getEventId(), userId);
        ensureEditable(ctx);

        String url = normalizeUrl(request.getRepositoryUrl());
        validateRepositoryUrl(url);

        com.seal.hackathon.aireview.entity.TeamRepository entity = upsertRepository(
                ctx.teamId(),
                userId,
                url,
                request.getRepositoryName(),
                SubmissionStatus.DRAFT,
                null);

        return buildResponse(ctx, entity);
    }

    @Transactional
    public SubmissionResponse submit(Long userId, SubmitSubmissionRequest request) {
        SubmissionContext ctx = resolveContext(request.getEventId(), userId);
        ensureEditable(ctx);
        ensureBeforeDeadline(ctx);

        String url = StringUtils.hasText(request.getRepositoryUrl())
                ? normalizeUrl(request.getRepositoryUrl())
                : teamRepositoryEntityRepository.findByTeamId(ctx.teamId())
                        .map(com.seal.hackathon.aireview.entity.TeamRepository::getRepositoryUrl)
                        .orElse(null);

        if (!StringUtils.hasText(url)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "REPOSITORY_URL_REQUIRED");
        }
        validateRepositoryUrl(url);

        String name = StringUtils.hasText(request.getRepositoryName())
                ? request.getRepositoryName().trim()
                : teamRepositoryEntityRepository.findByTeamId(ctx.teamId())
                        .map(com.seal.hackathon.aireview.entity.TeamRepository::getRepositoryName)
                        .orElse(null);

        OffsetDateTime now = OffsetDateTime.now();
        com.seal.hackathon.aireview.entity.TeamRepository entity = upsertRepository(ctx.teamId(), userId, url, name, SubmissionStatus.SUBMITTED, now);
        Team team = teamRepository.findById(ctx.teamId()).orElse(null);
        Event event = eventRepository.findById(request.getEventId()).orElse(null);
        if (team != null && event != null) {
            notificationService.notifySubmissionSubmitted(team, event, url);
        }
        return buildResponse(ctx, entity);
    }

    private com.seal.hackathon.aireview.entity.TeamRepository upsertRepository(
            Long teamId,
            Long userId,
            String url,
            String name,
            SubmissionStatus status,
            OffsetDateTime submittedAt) {
        OffsetDateTime now = OffsetDateTime.now();
        com.seal.hackathon.aireview.entity.TeamRepository entity =
                teamRepositoryEntityRepository.findByTeamId(teamId).orElse(null);

        if (entity == null) {
            entity = com.seal.hackathon.aireview.entity.TeamRepository.builder()
                    .teamId(teamId)
                    .repositoryUrl(url)
                    .repositoryName(StringUtils.hasText(name) ? name.trim() : null)
                    .reviewIntervalMinutes(DEFAULT_REVIEW_INTERVAL_MINUTES)
                    .status(status)
                    .submittedAt(submittedAt)
                    .createdBy(userId)
                    .createdAt(now)
                    .updatedAt(now)
                    .build();
        } else {
            entity.setRepositoryUrl(url);
            if (StringUtils.hasText(name)) {
                entity.setRepositoryName(name.trim());
            }
            entity.setStatus(status);
            entity.setSubmittedAt(submittedAt);
            entity.setUpdatedAt(now);
            if (entity.getCreatedBy() == null) {
                entity.setCreatedBy(userId);
            }
        }

        return teamRepositoryEntityRepository.save(entity);
    }

    private SubmissionResponse buildResponse(
            SubmissionContext ctx, com.seal.hackathon.aireview.entity.TeamRepository entity) {
        boolean beforeDeadline = ctx.deadlineAt() == null || OffsetDateTime.now().isBefore(ctx.deadlineAt());
        boolean alreadySubmitted = entity != null && entity.getStatus() == SubmissionStatus.SUBMITTED;
        boolean editable = beforeDeadline && ctx.blockReason() == null && !alreadySubmitted;

        return SubmissionResponse.builder()
                .teamId(ctx.teamId())
                .teamName(ctx.teamName())
                .status(entity != null ? entity.getStatus() : null)
                .repositoryUrl(entity != null ? entity.getRepositoryUrl() : null)
                .repositoryName(entity != null ? entity.getRepositoryName() : null)
                .submittedAt(entity != null ? entity.getSubmittedAt() : null)
                .deadlineAt(ctx.deadlineAt())
                .canSubmit(editable)
                .editable(editable)
                .blockReason(ctx.blockReason())
                .build();
    }

    private void ensureEditable(SubmissionContext ctx) {
        if (ctx.blockReason() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, ctx.blockReason());
        }
        if (ctx.deadlineAt() != null && !OffsetDateTime.now().isBefore(ctx.deadlineAt())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "SUBMISSION_DEADLINE_PASSED");
        }
        if (ctx.teamId() != null) {
            teamRepositoryEntityRepository.findByTeamId(ctx.teamId()).ifPresent(entity -> {
                if (entity.getStatus() == SubmissionStatus.SUBMITTED) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "SUBMISSION_ALREADY_SUBMITTED");
                }
            });
        }
    }

    private void ensureBeforeDeadline(SubmissionContext ctx) {
        if (ctx.deadlineAt() != null && !OffsetDateTime.now().isBefore(ctx.deadlineAt())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "SUBMISSION_DEADLINE_PASSED");
        }
    }

    private SubmissionContext resolveContext(Long eventId, Long userId) {
        MyBoardResponse board = contestManagementService.getMyBoard(eventId, userId);
        if (!board.isAssigned()) {
            String reason = board.getReason() != null ? board.getReason() : "NOT_ASSIGNED";
            return blockedContext(reason);
        }

        Team team = teamRepository.findById(board.getTeamId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "TEAM_NOT_FOUND"));

        MyProblemResponse problem = contestManagementService.getMyProblem(eventId, userId);
        if (!problem.isAvailable()) {
            String reason = problem.getReason() != null ? problem.getReason() : "PROBLEM_UNAVAILABLE";
            if ("NO_PROBLEM".equals(reason) || "NOT_RELEASED".equals(reason) || "PROBLEM_CLOSED".equals(reason)) {
                return blockedContext(reason);
            }
            return blockedContext(reason);
        }

        OffsetDateTime deadline = problem.getCloseAt();
        return new SubmissionContext(team.getId(), team.getName(), deadline, null);
    }

    private SubmissionContext blockedContext(String reason) {
        return new SubmissionContext(null, null, null, reason);
    }

    private String normalizeUrl(String raw) {
        return raw.trim();
    }

    private void validateRepositoryUrl(String url) {
        try {
            URI uri = URI.create(url);
            String host = uri.getHost();
            if (host == null) {
                throw new IllegalArgumentException("invalid host");
            }
            String lower = host.toLowerCase(Locale.ROOT);
            boolean allowed = lower.equals("github.com")
                    || lower.endsWith(".github.com")
                    || lower.equals("gitlab.com")
                    || lower.endsWith(".gitlab.com");
            if (!allowed) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_REPOSITORY_URL");
            }
            if (!StringUtils.hasText(uri.getPath()) || "/".equals(uri.getPath())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_REPOSITORY_URL");
            }
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_REPOSITORY_URL");
        }
    }

    private SubmissionResponse buildAdminResponse(
            Team team,
            com.seal.hackathon.aireview.entity.TeamRepository entity,
            OffsetDateTime deadlineAt) {
        return SubmissionResponse.builder()
                .teamId(team.getId())
                .teamName(team.getName())
                .status(entity != null ? entity.getStatus() : null)
                .repositoryUrl(entity != null ? entity.getRepositoryUrl() : null)
                .repositoryName(entity != null ? entity.getRepositoryName() : null)
                .submittedAt(entity != null ? entity.getSubmittedAt() : null)
                .deadlineAt(deadlineAt)
                .canSubmit(false)
                .editable(false)
                .blockReason(null)
                .build();
    }

    private OffsetDateTime resolveDeadlineForTeam(Long teamId, Long eventId) {
        List<BoardSlot> slots = boardSlotRepository.findByTeamId(teamId);
        if (slots.isEmpty()) {
            return null;
        }
        BoardSlot slot = slots.get(0);
        if (slot.getBoardId() == null) {
            return null;
        }
        return problemRepository.findByBoardId(slot.getBoardId()).stream()
                .map(Problem::getCloseAt)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);
    }

    private CurrentUserPrincipal requireOrganizer() {
        CurrentUserPrincipal principal = currentUserProvider.getCurrentUser();
        if (principal.getRoles() == null || !principal.getRoles().contains("ORGANIZER")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ONLY_ORGANIZER");
        }
        return principal;
    }

    private void assertOrganizerOwnsEvent(CurrentUserPrincipal principal, Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND"));
        if (event.getCreatedBy() == null || !Objects.equals(event.getCreatedBy(), principal.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "EVENT_ACCESS_DENIED");
        }
    }

    private record SubmissionContext(Long teamId, String teamName, OffsetDateTime deadlineAt, String blockReason) {}
}
