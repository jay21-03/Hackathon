package com.seal.hackathon.submission.service;

import com.seal.hackathon.aireview.entity.RepoCommit;
import com.seal.hackathon.aireview.repository.RepoCommitRepository;
import com.seal.hackathon.aireview.repository.TeamRepositoryEntityRepository;
import com.seal.hackathon.authprofile.security.CurrentUserPrincipal;
import com.seal.hackathon.authprofile.security.CurrentUserProvider;
import com.seal.hackathon.common.security.OrganizerAuthorizationService;
import com.seal.hackathon.common.enums.RepositoryAccessStatus;
import com.seal.hackathon.common.enums.RepositoryProvisionStatus;
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
import com.seal.hackathon.submission.dto.EventSubmissionSummaryResponse;
import com.seal.hackathon.notification.service.NotificationService;
import com.seal.hackathon.submission.dto.SaveSubmissionDraftRequest;
import com.seal.hackathon.submission.dto.SubmissionResponse;
import com.seal.hackathon.submission.dto.SubmitSubmissionRequest;
import com.seal.hackathon.common.response.PagedResult;
import com.seal.hackathon.common.util.PageRequestUtils;
import com.seal.hackathon.common.util.RepositoryUrlValidation;
import com.seal.hackathon.common.util.SubmissionLifecycle;
import com.seal.hackathon.github.service.RepoCommitService;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class SubmissionService {

    private static final int DEFAULT_REVIEW_INTERVAL_MINUTES = 60;

    private final ContestManagementService contestManagementService;
    private final TeamRepositoryEntityRepository teamRepositoryEntityRepository;
    private final TeamRepository teamRepository;
    private final EventRepository eventRepository;
    private final RoundRepository roundRepository;
    private final BoardRepository boardRepository;
    private final BoardSlotRepository boardSlotRepository;
    private final ProblemRepository problemRepository;
    private final CurrentUserProvider currentUserProvider;
    private final OrganizerAuthorizationService organizerAuthorizationService;
    private final NotificationService notificationService;
    private final RepoCommitService repoCommitService;
    private final RepoCommitRepository repoCommitRepository;

    @Transactional(readOnly = true)
    public PagedResult<AdminTeamSubmissionResponse> listSubmissionsPaged(
            Long eventId, Long boardId, Long roundId, String statusFilter, String query, int page, int size) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        int resolvedSize = PageRequestUtils.resolveSize(size);
        int resolvedPage = PageRequestUtils.resolvePage(page);
        if (StringUtils.hasText(statusFilter) || StringUtils.hasText(query)) {
            List<AdminTeamSubmissionResponse> allRows = collectSubmissionRows(eventId, boardId, roundId);
            List<AdminTeamSubmissionResponse> filtered = filterSubmissionRows(allRows, statusFilter, query);
            return paginateSubmissionRows(filtered, resolvedPage, resolvedSize);
        }

        PageRequest pageable = PageRequest.of(
                resolvedPage, resolvedSize, Sort.by(Sort.Direction.ASC, "teamNumber"));

        Page<BoardSlot> slotPage;
        if (boardId != null) {
            Board board = boardRepository.findById(boardId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "BOARD_NOT_FOUND"));
            Round round = roundRepository.findById(board.getRoundId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ROUND_NOT_FOUND"));
            if (!eventId.equals(round.getEventId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "BOARD_EVENT_MISMATCH");
            }
            slotPage = boardSlotRepository.findByBoardIdAndTeamIdIsNotNullOrderByTeamNumberAsc(boardId, pageable);
        } else if (roundId != null) {
            Round round = roundRepository.findById(roundId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ROUND_NOT_FOUND"));
            if (!eventId.equals(round.getEventId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ROUND_EVENT_MISMATCH");
            }
            slotPage = boardSlotRepository.findByRoundIdAndTeamIdIsNotNullOrderByTeamNumberAsc(roundId, pageable);
        } else {
            return listDedupedSubmissionsPaged(eventId, resolvedPage, resolvedSize);
        }

        Map<Long, Board> boardById = new HashMap<>();
        List<AdminTeamSubmissionResponse> items = new ArrayList<>();
        for (BoardSlot slot : slotPage.getContent()) {
            if (slot.getBoardId() != null && !boardById.containsKey(slot.getBoardId())) {
                boardRepository.findById(slot.getBoardId()).ifPresent(b -> boardById.put(b.getId(), b));
            }
            items.add(toAdminSubmissionRow(slot, boardById.get(slot.getBoardId())));
        }

        return PagedResult.<AdminTeamSubmissionResponse>builder()
                .items(items)
                .page(resolvedPage)
                .size(resolvedSize)
                .total(slotPage.getTotalElements())
                .totalPages(slotPage.getTotalPages())
                .build();
    }

    @Transactional(readOnly = true)
    public EventSubmissionSummaryResponse summarizeEventSubmissions(Long eventId) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        Map<Long, BoardSlot> slotByTeamId = new LinkedHashMap<>();
        Map<Long, Board> boardById = new HashMap<>();
        for (Round round : roundRepository.findByEventId(eventId)) {
            for (BoardSlot slot : boardSlotRepository.findByRoundId(round.getId())) {
                if (slot.getTeamId() == null) {
                    continue;
                }
                slotByTeamId.putIfAbsent(slot.getTeamId(), slot);
                if (slot.getBoardId() != null && !boardById.containsKey(slot.getBoardId())) {
                    boardRepository.findById(slot.getBoardId()).ifPresent(b -> boardById.put(b.getId(), b));
                }
            }
        }

        long submittedCount = 0;
        long draftCount = 0;
        for (BoardSlot slot : slotByTeamId.values()) {
            AdminTeamSubmissionResponse row = toAdminSubmissionRow(slot, boardById.get(slot.getBoardId()));
            if (row.getStatus() == SubmissionStatus.SUBMITTED) {
                submittedCount++;
            } else if (row.getStatus() == SubmissionStatus.DRAFT) {
                draftCount++;
            }
        }

        return EventSubmissionSummaryResponse.builder()
                .totalTeams(slotByTeamId.size())
                .submittedCount(submittedCount)
                .draftCount(draftCount)
                .build();
    }

    private List<AdminTeamSubmissionResponse> collectSubmissionRows(Long eventId, Long boardId, Long roundId) {
        if (boardId != null) {
            Board board = boardRepository.findById(boardId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "BOARD_NOT_FOUND"));
            Round round = roundRepository.findById(board.getRoundId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ROUND_NOT_FOUND"));
            if (!eventId.equals(round.getEventId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "BOARD_EVENT_MISMATCH");
            }
            return mapSlotsToSubmissionRows(
                    boardSlotRepository.findByBoardIdOrderByTeamNumberAsc(boardId).stream()
                            .filter(slot -> slot.getTeamId() != null)
                            .toList());
        }
        if (roundId != null) {
            Round round = roundRepository.findById(roundId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ROUND_NOT_FOUND"));
            if (!eventId.equals(round.getEventId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ROUND_EVENT_MISMATCH");
            }
            return mapSlotsToSubmissionRows(
                    boardSlotRepository.findByRoundId(roundId).stream()
                            .filter(slot -> slot.getTeamId() != null)
                            .sorted(Comparator.comparing(
                                    BoardSlot::getTeamNumber, Comparator.nullsLast(Integer::compareTo)))
                            .toList());
        }
        Map<Long, BoardSlot> slotByTeamId = new LinkedHashMap<>();
        Map<Long, Board> boardById = new HashMap<>();
        for (Round round : roundRepository.findByEventId(eventId)) {
            for (BoardSlot slot : boardSlotRepository.findByRoundId(round.getId())) {
                if (slot.getTeamId() == null) {
                    continue;
                }
                slotByTeamId.putIfAbsent(slot.getTeamId(), slot);
                if (slot.getBoardId() != null && !boardById.containsKey(slot.getBoardId())) {
                    boardRepository.findById(slot.getBoardId()).ifPresent(b -> boardById.put(b.getId(), b));
                }
            }
        }
        List<BoardSlot> allSlots = slotByTeamId.values().stream()
                .sorted(Comparator.comparing(
                        BoardSlot::getTeamNumber, Comparator.nullsLast(Integer::compareTo)))
                .toList();
        List<AdminTeamSubmissionResponse> items = new ArrayList<>();
        for (BoardSlot slot : allSlots) {
            items.add(toAdminSubmissionRow(slot, boardById.get(slot.getBoardId())));
        }
        return items;
    }

    private List<AdminTeamSubmissionResponse> mapSlotsToSubmissionRows(List<BoardSlot> slots) {
        Map<Long, Board> boardById = new HashMap<>();
        List<AdminTeamSubmissionResponse> items = new ArrayList<>();
        for (BoardSlot slot : slots) {
            if (slot.getBoardId() != null && !boardById.containsKey(slot.getBoardId())) {
                boardRepository.findById(slot.getBoardId()).ifPresent(b -> boardById.put(b.getId(), b));
            }
            items.add(toAdminSubmissionRow(slot, boardById.get(slot.getBoardId())));
        }
        return items;
    }

    private List<AdminTeamSubmissionResponse> filterSubmissionRows(
            List<AdminTeamSubmissionResponse> rows, String statusFilter, String query) {
        String normalizedStatus = StringUtils.hasText(statusFilter) ? statusFilter.trim().toUpperCase() : null;
        String normalizedQuery = StringUtils.hasText(query) ? query.trim().toLowerCase() : null;
        return rows.stream()
                .filter(row -> matchesSubmissionStatus(row, normalizedStatus))
                .filter(row -> {
                    if (normalizedQuery == null) {
                        return true;
                    }
                    String teamName = row.getTeamName() != null ? row.getTeamName().toLowerCase() : "";
                    String boardName = row.getBoardName() != null ? row.getBoardName().toLowerCase() : "";
                    return teamName.contains(normalizedQuery) || boardName.contains(normalizedQuery);
                })
                .toList();
    }

    private boolean matchesSubmissionStatus(AdminTeamSubmissionResponse row, String normalizedStatus) {
        if (normalizedStatus == null || "ALL".equals(normalizedStatus)) {
            return true;
        }
        String rowStatus = row.getStatus() != null ? row.getStatus().name() : "NONE";
        return normalizedStatus.equals(rowStatus);
    }

    private PagedResult<AdminTeamSubmissionResponse> paginateSubmissionRows(
            List<AdminTeamSubmissionResponse> rows, int page, int size) {
        int total = rows.size();
        int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / size);
        int fromIndex = Math.min(page * size, total);
        int toIndex = Math.min(fromIndex + size, total);
        List<AdminTeamSubmissionResponse> pageItems = rows.subList(fromIndex, toIndex);
        return PagedResult.<AdminTeamSubmissionResponse>builder()
                .items(pageItems)
                .page(page)
                .size(size)
                .total(total)
                .totalPages(totalPages)
                .build();
    }

    private PagedResult<AdminTeamSubmissionResponse> listDedupedSubmissionsPaged(
            Long eventId, int page, int size) {
        Map<Long, BoardSlot> slotByTeamId = new LinkedHashMap<>();
        Map<Long, Board> boardById = new HashMap<>();
        for (Round round : roundRepository.findByEventId(eventId)) {
            for (BoardSlot slot : boardSlotRepository.findByRoundId(round.getId())) {
                if (slot.getTeamId() == null) {
                    continue;
                }
                slotByTeamId.putIfAbsent(slot.getTeamId(), slot);
                if (slot.getBoardId() != null && !boardById.containsKey(slot.getBoardId())) {
                    boardRepository.findById(slot.getBoardId()).ifPresent(b -> boardById.put(b.getId(), b));
                }
            }
        }

        List<BoardSlot> allSlots = slotByTeamId.values().stream()
                .sorted(Comparator.comparing(
                        BoardSlot::getTeamNumber, Comparator.nullsLast(Integer::compareTo)))
                .toList();
        int total = allSlots.size();
        int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / size);
        int fromIndex = Math.min(page * size, total);
        int toIndex = Math.min(fromIndex + size, total);
        List<BoardSlot> pageSlots = allSlots.subList(fromIndex, toIndex);

        List<AdminTeamSubmissionResponse> items = new ArrayList<>();
        for (BoardSlot slot : pageSlots) {
            items.add(toAdminSubmissionRow(slot, boardById.get(slot.getBoardId())));
        }

        return PagedResult.<AdminTeamSubmissionResponse>builder()
                .items(items)
                .page(page)
                .size(size)
                .total(total)
                .totalPages(totalPages)
                .build();
    }

    private AdminTeamSubmissionResponse toAdminSubmissionRow(BoardSlot slot, Board board) {
        Long teamId = slot.getTeamId();
        Team team = teamId == null ? null : teamRepository.findById(teamId).orElse(null);
        if (team == null) {
            return AdminTeamSubmissionResponse.builder()
                    .teamId(teamId)
                    .boardId(slot.getBoardId())
                    .boardName(board != null ? board.getName() : null)
                    .slotNumber(slot.getTeamNumber())
                    .build();
        }
        com.seal.hackathon.aireview.entity.TeamRepository repo = resolveRepositoryForParticipantAdmin(slot, board);
        OffsetDateTime deadlineAt = resolveDeadlineForBoard(slot.getBoardId());
        RepoCommit latestCommit = repo != null
                ? repoCommitRepository
                        .findTopByTeamRepositoryIdOrderByCommittedAtDescIdDesc(repo.getId())
                        .orElse(null)
                : null;
        long commitCount = repo != null ? repoCommitRepository.countByTeamRepositoryId(repo.getId()) : 0L;
        return AdminTeamSubmissionResponse.builder()
                .teamId(teamId)
                .teamName(team.getName())
                .boardId(slot.getBoardId())
                .boardName(board != null ? board.getName() : null)
                .slotNumber(slot.getTeamNumber())
                .status(repo != null ? effectiveStatus(repo, deadlineAt) : null)
                .repositoryUrl(repo != null ? repo.getRepositoryUrl() : null)
                .repositoryName(repo != null ? repo.getRepositoryName() : null)
                .submittedAt(repo != null ? effectiveSubmittedAt(repo, deadlineAt) : null)
                .lastPushAt(repo != null ? repo.getLastPushAt() : null)
                .latestCommitSha(latestCommit != null ? latestCommit.getCommitSha() : null)
                .latestCommitMessage(latestCommit != null ? latestCommit.getMessage() : null)
                .latestCommitAt(latestCommit != null ? latestCommit.getCommittedAt() : null)
                .commitCount(commitCount > 0 ? (int) commitCount : null)
                .build();
    }

    @Transactional(readOnly = true)
    public List<AdminTeamSubmissionResponse> listSubmissionsForOrganizer(Long eventId, Long boardId) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);

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
            Board board = slot.getBoardId() != null ? boardById.get(slot.getBoardId()) : null;
            com.seal.hackathon.aireview.entity.TeamRepository repo = resolveRepositoryForParticipantAdmin(slot, board);
            OffsetDateTime deadlineAt = resolveDeadlineForBoard(slot.getBoardId());
            results.add(AdminTeamSubmissionResponse.builder()
                    .teamId(teamId)
                    .teamName(team.getName())
                    .boardId(slot.getBoardId())
                    .boardName(board != null ? board.getName() : null)
                    .slotNumber(slot.getTeamNumber())
                    .status(repo != null ? effectiveStatus(repo, deadlineAt) : null)
                    .repositoryUrl(repo != null ? repo.getRepositoryUrl() : null)
                    .repositoryName(repo != null ? repo.getRepositoryName() : null)
                    .submittedAt(repo != null ? effectiveSubmittedAt(repo, deadlineAt) : null)
                    .lastPushAt(repo != null ? repo.getLastPushAt() : null)
                    .build());
        }

        results.sort(Comparator
                .comparing(AdminTeamSubmissionResponse::getBoardName, Comparator.nullsLast(String::compareToIgnoreCase))
                .thenComparing(AdminTeamSubmissionResponse::getSlotNumber, Comparator.nullsLast(Integer::compareTo))
                .thenComparing(AdminTeamSubmissionResponse::getTeamName, Comparator.nullsLast(String::compareToIgnoreCase)));
        return results;
    }

    @Transactional(readOnly = true)
    public AdminTeamSubmissionResponse getAdminTeamSubmission(Long teamId, Long boardId, Long roundId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "TEAM_NOT_FOUND"));
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(team.getEventId());

        BoardSlot slot = resolveAdminSubmissionSlot(teamId, boardId, roundId, team.getEventId());
        if (slot != null) {
            Board board = slot.getBoardId() == null
                    ? null
                    : boardRepository.findById(slot.getBoardId()).orElse(null);
            return toAdminSubmissionRow(slot, board);
        }

        return AdminTeamSubmissionResponse.builder()
                .teamId(teamId)
                .teamName(team.getName())
                .build();
    }

    @Transactional(readOnly = true)
    public SubmissionResponse getSubmission(Long eventId, Long userId) {
        SubmissionContext ctx = resolveContext(eventId, userId);
        com.seal.hackathon.aireview.entity.TeamRepository entity = ctx.teamId() == null
                ? null
                : resolveRepositoryForParticipant(eventId, userId, ctx.teamId());
        return buildResponse(ctx, entity);
    }

    @Transactional
    public SubmissionResponse saveDraft(Long userId, SaveSubmissionDraftRequest request) {
        SubmissionContext ctx = resolveContext(request.getEventId(), userId);
        ensureEditable(ctx);

        String url = normalizeUrl(request.getRepositoryUrl());
        validateRepositoryUrl(url);

        com.seal.hackathon.aireview.entity.TeamRepository entity = upsertRepository(
                ctx,
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
                : repositoryUrl(resolveRepositoryForContext(ctx));

        if (!StringUtils.hasText(url)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "REPOSITORY_URL_REQUIRED");
        }
        validateRepositoryUrl(url);

        String name = StringUtils.hasText(request.getRepositoryName())
                ? request.getRepositoryName().trim()
                : repositoryName(resolveRepositoryForContext(ctx));

        OffsetDateTime now = OffsetDateTime.now();
        com.seal.hackathon.aireview.entity.TeamRepository entity =
                upsertRepository(ctx, userId, url, name, SubmissionStatus.SUBMITTED, now);
        Team team = teamRepository.findById(ctx.teamId()).orElse(null);
        Event event = eventRepository.findById(request.getEventId()).orElse(null);
        if (team != null && event != null) {
            notificationService.notifySubmissionSubmitted(team, event, url);
        }
        return buildResponse(ctx, entity);
    }

    private com.seal.hackathon.aireview.entity.TeamRepository upsertRepository(
            SubmissionContext ctx,
            Long userId,
            String url,
            String name,
            SubmissionStatus status,
            OffsetDateTime submittedAt) {
        OffsetDateTime now = OffsetDateTime.now();
        com.seal.hackathon.aireview.entity.TeamRepository entity = resolveRepositoryForContext(ctx);

        if (entity == null) {
            entity = com.seal.hackathon.aireview.entity.TeamRepository.builder()
                    .teamId(ctx.teamId())
                    .roundId(ctx.roundId())
                    .boardId(ctx.boardId())
                    .problemId(ctx.problemId())
                    .repositoryUrl(url)
                    .repositoryName(StringUtils.hasText(name) ? name.trim() : null)
                    .reviewIntervalMinutes(DEFAULT_REVIEW_INTERVAL_MINUTES)
                    .status(status)
                    .submittedAt(submittedAt)
                    .accessStatus(RepositoryAccessStatus.OPEN)
                    .provisionStatus(RepositoryProvisionStatus.CREATED)
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
            entity.setRoundId(ctx.roundId());
            entity.setBoardId(ctx.boardId());
            entity.setProblemId(ctx.problemId());
            if (StringUtils.hasText(url) && entity.getProvisionStatus() == RepositoryProvisionStatus.PENDING) {
                entity.setProvisionStatus(RepositoryProvisionStatus.CREATED);
            }
            if (entity.getAccessStatus() == null || entity.getAccessStatus() == RepositoryAccessStatus.PENDING) {
                entity.setAccessStatus(RepositoryAccessStatus.OPEN);
            }
            if (entity.getCreatedBy() == null) {
                entity.setCreatedBy(userId);
            }
        }

        return teamRepositoryEntityRepository.save(entity);
    }

    private SubmissionResponse buildResponse(
            SubmissionContext ctx, com.seal.hackathon.aireview.entity.TeamRepository entity) {
        boolean beforeDeadline = ctx.deadlineAt() == null || OffsetDateTime.now().isBefore(ctx.deadlineAt());
        SubmissionStatus status = effectiveStatus(entity, ctx.deadlineAt());
        boolean alreadySubmitted = status == SubmissionStatus.SUBMITTED;
        boolean editable = beforeDeadline && ctx.blockReason() == null && !alreadySubmitted;

        return SubmissionResponse.builder()
                .teamId(ctx.teamId())
                .teamName(ctx.teamName())
                .status(status)
                .repositoryUrl(entity != null ? entity.getRepositoryUrl() : null)
                .repositoryName(entity != null ? entity.getRepositoryName() : null)
                .submittedAt(entity != null ? effectiveSubmittedAt(entity, ctx.deadlineAt()) : null)
                .deadlineAt(ctx.deadlineAt())
                .canSubmit(editable)
                .editable(editable)
                .blockReason(ctx.blockReason())
                .build();
    }

    @Transactional
    public int finalizeSubmissionsForClosedProblems() {
        OffsetDateTime now = OffsetDateTime.now();
        int finalized = 0;
        for (Problem problem : problemRepository.findByCloseAtLessThanEqual(now)) {
            if (problem.getBoardId() == null) {
                continue;
            }
            OffsetDateTime closeAt = problem.getCloseAt();
            for (BoardSlot slot : boardSlotRepository.findByBoardId(problem.getBoardId())) {
                if (slot.getTeamId() == null) {
                    continue;
                }
                com.seal.hackathon.aireview.entity.TeamRepository repository =
                        teamRepositoryEntityRepository
                                .findByTeamIdAndProblemId(slot.getTeamId(), problem.getId())
                                .orElseGet(() -> resolveRepositoryForSlot(slot, boardRepository
                                        .findById(problem.getBoardId())
                                        .orElse(null)));
                if (repository == null || repository.getStatus() == SubmissionStatus.SUBMITTED) {
                    continue;
                }
                SubmissionLifecycle.finalizeAtClose(repository, closeAt, now);
                if (repository.getStatus() == SubmissionStatus.SUBMITTED) {
                    repoCommitService.captureLatestCommitSilently(repository.getId());
                    repository.setUpdatedAt(now);
                    teamRepositoryEntityRepository.save(repository);
                    finalized++;
                }
            }
        }
        return finalized;
    }

    private void ensureEditable(SubmissionContext ctx) {
        if (ctx.blockReason() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, ctx.blockReason());
        }
        if (ctx.deadlineAt() != null && !OffsetDateTime.now().isBefore(ctx.deadlineAt())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "SUBMISSION_DEADLINE_PASSED");
        }
        if (ctx.teamId() != null) {
            com.seal.hackathon.aireview.entity.TeamRepository entity = resolveRepositoryForContext(ctx);
            if (entity != null && effectiveStatus(entity, ctx.deadlineAt()) == SubmissionStatus.SUBMITTED) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "SUBMISSION_ALREADY_SUBMITTED");
            }
        }
    }

    private void ensureBeforeDeadline(SubmissionContext ctx) {
        if (ctx.deadlineAt() != null && !OffsetDateTime.now().isBefore(ctx.deadlineAt())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "SUBMISSION_DEADLINE_PASSED");
        }
    }

    private com.seal.hackathon.aireview.entity.TeamRepository findTeamLevelRepository(Long teamId) {
        return teamRepositoryEntityRepository
                .findFirstByTeamIdAndProblemIdIsNullOrderByUpdatedAtDesc(teamId)
                .orElse(null);
    }

    private com.seal.hackathon.aireview.entity.TeamRepository resolveRepositoryForContext(SubmissionContext ctx) {
        if (ctx.teamId() == null) {
            return null;
        }
        if (ctx.problemId() != null) {
            return teamRepositoryEntityRepository
                    .findByTeamIdAndProblemId(ctx.teamId(), ctx.problemId())
                    .orElse(null);
        }
        if (ctx.roundId() != null) {
            return findRoundScopedRepository(ctx.teamId(), ctx.roundId()).orElse(null);
        }
        return findTeamLevelRepository(ctx.teamId());
    }

    private com.seal.hackathon.aireview.entity.TeamRepository resolveRepositoryForParticipant(
            Long eventId, Long userId, Long teamId) {
        MyBoardResponse board = contestManagementService.getMyBoard(eventId, userId);
        if (board.isAssigned() && board.getBoardId() != null) {
            BoardSlot slot = boardSlotRepository.findByBoardId(board.getBoardId()).stream()
                    .filter(s -> teamId.equals(s.getTeamId()))
                    .findFirst()
                    .orElse(null);
            Board boardEntity = boardRepository.findById(board.getBoardId()).orElse(null);
            if (slot != null && boardEntity != null) {
                com.seal.hackathon.aireview.entity.TeamRepository scoped =
                        resolveRepositoryForSlot(slot, boardEntity);
                if (scoped != null) {
                    return scoped;
                }
            }
        }
        return findTeamLevelRepository(teamId);
    }

    private BoardSlot resolveAdminSubmissionSlot(
            Long teamId, Long boardId, Long roundId, Long eventId) {
        if (boardId != null) {
            Board board = boardRepository.findById(boardId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "BOARD_NOT_FOUND"));
            Round round = roundRepository.findById(board.getRoundId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ROUND_NOT_FOUND"));
            if (!eventId.equals(round.getEventId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "BOARD_EVENT_MISMATCH");
            }
            return boardSlotRepository.findByBoardId(boardId).stream()
                    .filter(slot -> teamId.equals(slot.getTeamId()))
                    .findFirst()
                    .orElse(null);
        }
        if (roundId != null) {
            Round round = roundRepository.findById(roundId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ROUND_NOT_FOUND"));
            if (!eventId.equals(round.getEventId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ROUND_EVENT_MISMATCH");
            }
            return boardSlotRepository.findByRoundId(roundId).stream()
                    .filter(slot -> teamId.equals(slot.getTeamId()))
                    .findFirst()
                    .orElse(null);
        }
        return boardSlotRepository.findByTeamId(teamId).stream()
                .filter(slot -> belongsToEvent(slot, eventId))
                .max(Comparator.comparing(
                        this::roundOrderForSlot,
                        Comparator.nullsLast(Integer::compareTo)))
                .orElse(null);
    }

    private boolean belongsToEvent(BoardSlot slot, Long eventId) {
        if (slot.getRoundId() != null) {
            return roundRepository.findById(slot.getRoundId())
                    .map(round -> eventId.equals(round.getEventId()))
                    .orElse(false);
        }
        if (slot.getBoardId() == null) {
            return false;
        }
        return boardRepository.findById(slot.getBoardId())
                .flatMap(board -> roundRepository.findById(board.getRoundId()))
                .map(round -> eventId.equals(round.getEventId()))
                .orElse(false);
    }

    private Integer roundOrderForSlot(BoardSlot slot) {
        Long roundId = slot.getRoundId();
        if (roundId == null && slot.getBoardId() != null) {
            roundId = boardRepository.findById(slot.getBoardId())
                    .map(Board::getRoundId)
                    .orElse(null);
        }
        if (roundId == null) {
            return null;
        }
        return roundRepository.findById(roundId).map(Round::getRoundOrder).orElse(null);
    }

    private Optional<Problem> findPrimaryProblemForBoard(Long boardId) {
        if (boardId == null) {
            return Optional.empty();
        }
        return problemRepository.findByBoardId(boardId).stream()
                .min(Comparator.comparing(Problem::getReleaseAt, Comparator.nullsLast(OffsetDateTime::compareTo))
                        .thenComparing(Problem::getId, Comparator.nullsLast(Long::compareTo)));
    }

    private com.seal.hackathon.aireview.entity.TeamRepository resolveRepositoryForParticipantAdmin(
            BoardSlot slot, Board board) {
        com.seal.hackathon.aireview.entity.TeamRepository scoped = resolveRepositoryForSlot(slot, board);
        if (scoped != null || slot == null || slot.getTeamId() == null) {
            return scoped;
        }
        return findTeamLevelRepository(slot.getTeamId());
    }

    private com.seal.hackathon.aireview.entity.TeamRepository resolveRepositoryForSlot(
            BoardSlot slot, Board board) {
        if (slot == null || slot.getTeamId() == null) {
            return null;
        }
        Long teamId = slot.getTeamId();
        Long boardId = board != null ? board.getId() : slot.getBoardId();
        Optional<Problem> problem = findPrimaryProblemForBoard(boardId);
        if (problem.isPresent()) {
            return teamRepositoryEntityRepository
                    .findByTeamIdAndProblemId(teamId, problem.get().getId())
                    .orElse(null);
        }
        Long roundId = board != null ? board.getRoundId() : slot.getRoundId();
        if (roundId == null) {
            return null;
        }
        Long resolvedRoundId = roundId;
        return findRoundScopedRepository(teamId, resolvedRoundId).orElse(null);
    }

    private Optional<com.seal.hackathon.aireview.entity.TeamRepository> findRoundScopedRepository(
            Long teamId, Long roundId) {
        return teamRepositoryEntityRepository.findAllByTeamId(teamId).stream()
                .filter(repo -> repo.getProblemId() == null)
                .filter(repo -> roundId.equals(repo.getRoundId()))
                .max(Comparator.comparing(
                        com.seal.hackathon.aireview.entity.TeamRepository::getUpdatedAt,
                        Comparator.nullsLast(Comparator.naturalOrder())));
    }

    private SubmissionStatus effectiveStatus(
            com.seal.hackathon.aireview.entity.TeamRepository entity, OffsetDateTime closeAt) {
        return SubmissionLifecycle.effectiveStatus(entity, closeAt);
    }

    private OffsetDateTime effectiveSubmittedAt(
            com.seal.hackathon.aireview.entity.TeamRepository entity, OffsetDateTime closeAt) {
        return SubmissionLifecycle.effectiveSubmittedAt(entity, closeAt);
    }

    private String repositoryUrl(com.seal.hackathon.aireview.entity.TeamRepository repository) {
        return repository == null ? null : repository.getRepositoryUrl();
    }

    private String repositoryName(com.seal.hackathon.aireview.entity.TeamRepository repository) {
        return repository == null ? null : repository.getRepositoryName();
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
            return new SubmissionContext(
                    team.getId(),
                    team.getName(),
                    board.getBoardId(),
                    board.getRoundId(),
                    problem.getProblem() != null ? problem.getProblem().getId() : null,
                    problem.getCloseAt(),
                    reason);
        }

        return new SubmissionContext(
                team.getId(),
                team.getName(),
                board.getBoardId(),
                board.getRoundId(),
                problem.getProblem() != null ? problem.getProblem().getId() : null,
                problem.getCloseAt(),
                null);
    }

    private SubmissionContext blockedContext(String reason) {
        return new SubmissionContext(null, null, null, null, null, null, reason);
    }

    private String normalizeUrl(String raw) {
        return raw.trim();
    }

    private void validateRepositoryUrl(String url) {
        if (!RepositoryUrlValidation.isValid(url)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_REPOSITORY_URL");
        }
    }

    private OffsetDateTime resolveDeadlineForBoard(Long boardId) {
        if (boardId == null) {
            return null;
        }
        return problemRepository.findByBoardId(boardId).stream()
                .map(Problem::getCloseAt)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);
    }

    private record SubmissionContext(
            Long teamId,
            String teamName,
            Long boardId,
            Long roundId,
            Long problemId,
            OffsetDateTime deadlineAt,
            String blockReason) {}
}
