package com.seal.hackathon.scoring.service;

import com.seal.hackathon.aireview.repository.TeamRepositoryEntityRepository;
import com.seal.hackathon.assignment.entity.JudgeAssignment;
import com.seal.hackathon.assignment.repository.JudgeAssignmentRepository;
import com.seal.hackathon.authprofile.entity.User;
import com.seal.hackathon.authprofile.repository.UserRepository;
import com.seal.hackathon.authprofile.security.CurrentUserPrincipal;
import com.seal.hackathon.authprofile.security.CurrentUserProvider;
import com.seal.hackathon.common.security.OrganizerAuthorizationService;
import com.seal.hackathon.common.enums.ScoreSheetStatus;
import com.seal.hackathon.common.enums.TeamStatus;
import com.seal.hackathon.common.util.ContestOrdering;
import com.seal.hackathon.contest.entity.Board;
import com.seal.hackathon.contest.entity.BoardSlot;
import com.seal.hackathon.contest.entity.Event;
import com.seal.hackathon.contest.entity.Round;
import com.seal.hackathon.contest.repository.BoardRepository;
import com.seal.hackathon.contest.repository.BoardSlotRepository;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.contest.repository.RoundRepository;
import com.seal.hackathon.contest.service.ContestPhaseGuardService;
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.assignment.service.BoardScoringReadinessService;
import com.seal.hackathon.notification.service.NotificationService;
import com.seal.hackathon.registration.repository.TeamRepository;
import com.seal.hackathon.scoring.dto.BoardBriefDto;
import com.seal.hackathon.scoring.dto.ComputedScoreDto;
import com.seal.hackathon.scoring.dto.CriteriaRequestItem;
import com.seal.hackathon.scoring.dto.CriteriaResponse;
import com.seal.hackathon.scoring.dto.EventScoreProgressResponse;
import com.seal.hackathon.scoring.dto.JudgeBriefDto;
import com.seal.hackathon.scoring.dto.JudgeProgressDto;
import com.seal.hackathon.scoring.dto.JudgeSheetStatusDto;
import com.seal.hackathon.scoring.util.HackathonRubricDefaults;
import com.seal.hackathon.scoring.util.LevelDescriptorNormalizer;
import com.seal.hackathon.scoring.dto.MatrixRowInput;
import com.seal.hackathon.scoring.dto.MatrixSummaryDto;
import com.seal.hackathon.scoring.dto.MatrixTeamRowResponse;
import com.seal.hackathon.scoring.dto.ProgressSummaryDto;
import com.seal.hackathon.scoring.dto.RubricResponse;
import com.seal.hackathon.scoring.dto.SaveMatrixRequest;
import com.seal.hackathon.scoring.dto.SaveMatrixResponse;
import com.seal.hackathon.scoring.dto.SaveRubricRequest;
import com.seal.hackathon.scoring.dto.ScoreItemInput;
import com.seal.hackathon.scoring.dto.ScoreItemResponse;
import com.seal.hackathon.scoring.dto.ScoreMatrixResponse;
import com.seal.hackathon.scoring.dto.ScoreProgressResponse;
import com.seal.hackathon.scoring.dto.ScoringReminderResponse;
import com.seal.hackathon.scoring.dto.SubmitFailureDto;
import com.seal.hackathon.scoring.dto.SubmitMatrixRequest;
import com.seal.hackathon.scoring.dto.SubmitMatrixResponse;
import com.seal.hackathon.scoring.dto.SubmittedSheetDto;
import com.seal.hackathon.scoring.dto.TeamProgressDto;
import com.seal.hackathon.scoring.entity.ScoreCriteria;
import com.seal.hackathon.scoring.entity.ScoreItem;
import com.seal.hackathon.scoring.entity.ScoreSheet;
import com.seal.hackathon.scoring.repository.ScoreCriteriaRepository;
import com.seal.hackathon.scoring.repository.ScoreItemRepository;
import com.seal.hackathon.scoring.repository.ScoreSheetRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ScoringService {

    private static final BigDecimal WEIGHT_TARGET = new BigDecimal("100");
    private static final BigDecimal WEIGHT_TOLERANCE = new BigDecimal("0.001");

    private final ScoreCriteriaRepository scoreCriteriaRepository;
    private final ScoreSheetRepository scoreSheetRepository;
    private final ScoreItemRepository scoreItemRepository;
    private final BoardRepository boardRepository;
    private final BoardSlotRepository boardSlotRepository;
    private final RoundRepository roundRepository;
    private final EventRepository eventRepository;
    private final JudgeAssignmentRepository judgeAssignmentRepository;
    private final TeamRepository teamRepository;
    private final TeamRepositoryEntityRepository teamRepositoryEntityRepository;
    private final UserRepository userRepository;
    private final CurrentUserProvider currentUserProvider;
    private final NotificationService notificationService;
    private final OrganizerAuthorizationService organizerAuthorizationService;
    private final BoardScoringReadinessService boardScoringReadinessService;
    private final ContestPhaseGuardService contestPhaseGuardService;
    private final ScoringRepositoryGuardService scoringRepositoryGuardService;

    @Transactional(readOnly = true)
    public RubricResponse getRubric(Long roundId) {
        List<ScoreCriteria> criteria = scoreCriteriaRepository.findByRoundIdOrderBySortOrderAsc(roundId);
        return buildRubricResponse(roundId, criteria);
    }

    @Transactional(readOnly = true)
    public RubricResponse getOrganizerRubric(Long roundId) {
        organizerAuthorizationService.requireRoundOwnedByCurrentOrganizer(roundId);
        return getRubric(roundId);
    }

    @Transactional
    public RubricResponse copyRubricFromRound(Long targetRoundId, Long sourceRoundId, boolean replaceExisting) {
        organizerAuthorizationService.requireRoundOwnedByCurrentOrganizer(targetRoundId);
        organizerAuthorizationService.requireRoundOwnedByCurrentOrganizer(sourceRoundId);
        List<ScoreCriteria> sourceCriteria =
                scoreCriteriaRepository.findByRoundIdOrderBySortOrderAsc(sourceRoundId);
        if (sourceCriteria.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "RUBRIC_NOT_CONFIGURED");
        }
        List<CriteriaRequestItem> items = sourceCriteria.stream()
                .map(this::toCriteriaRequestItem)
                .toList();
        SaveRubricRequest request = new SaveRubricRequest();
        request.setReplaceExisting(replaceExisting);
        request.setCriteria(items);
        return saveRubric(targetRoundId, request);
    }

    @Transactional
    public RubricResponse saveRubric(Long roundId, SaveRubricRequest request) {
        organizerAuthorizationService.requireRoundOwnedByCurrentOrganizer(roundId);

        if (isRubricLocked(roundId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "RUBRIC_LOCKED");
        }

        normalizeRubricLevelDescriptors(request);
        validateRubricRequest(request);

        if (!request.isReplaceExisting()
                && !scoreCriteriaRepository.findByRoundIdOrderBySortOrderAsc(roundId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "RUBRIC_EXISTS_USE_REPLACE");
        }

        if (request.isReplaceExisting()) {
            replaceRubricCriteria(roundId, request.getCriteria());
        } else {
            insertRubricCriteria(roundId, request.getCriteria());
        }

        List<ScoreCriteria> saved = scoreCriteriaRepository.findByRoundIdOrderBySortOrderAsc(roundId);
        RubricResponse response = buildRubricResponse(roundId, saved);
        boardScoringReadinessService.notifyReadyJudgesForRound(roundId);
        return response;
    }

    @Transactional
    public ScoreMatrixResponse getScoreMatrix(Long boardId) {
        CurrentUserPrincipal judge = requireJudge();
        BoardContext ctx = loadBoardContextForJudge(boardId, judge.getUserId());

        List<ScoreCriteria> criteria = requireCriteria(ctx.round.getId());
        List<BoardSlot> slots = sortedScorableSlotsWithTeams(boardId);
        if (slots.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "BOARD_REPOSITORIES_NOT_READY:[]");
        }

        for (BoardSlot slot : slots) {
            ensureDraftSheet(boardId, slot.getTeamId(), judge.getUserId(), ctx.assignment.getId());
        }

        return buildMatrixResponse(ctx, criteria, slots, judge.getUserId());
    }

    @Transactional
    public SaveMatrixResponse saveScoreMatrix(Long boardId, SaveMatrixRequest request) {
        CurrentUserPrincipal judge = requireJudge();
        BoardContext ctx = loadBoardContextForJudge(boardId, judge.getUserId());
        List<ScoreCriteria> criteria = requireCriteria(ctx.round.getId());
        Map<Long, ScoreCriteria> criteriaById = criteria.stream()
                .collect(Collectors.toMap(ScoreCriteria::getId, c -> c));

        List<Long> saved = new ArrayList<>();
        List<Long> skipped = new ArrayList<>();
        List<MatrixTeamRowResponse> rows = new ArrayList<>();

        if (request.getRows() == null) {
            return SaveMatrixResponse.builder()
                    .savedTeamIds(saved)
                    .skippedSubmittedTeamIds(skipped)
                    .rows(rows)
                    .build();
        }

        for (MatrixRowInput row : request.getRows()) {
            ScoreSheet sheet = scoreSheetRepository
                    .findByBoardIdAndTeamIdAndJudgeId(boardId, row.getTeamId(), judge.getUserId())
                    .orElseGet(() -> ensureDraftSheet(boardId, row.getTeamId(), judge.getUserId(), ctx.assignment.getId()));

            assertTeamInBoard(boardId, row.getTeamId());
            assertTeamScorable(row.getTeamId());
            scoringRepositoryGuardService.requireTeamRepositoryReady(boardId, row.getTeamId());
            if (sheet.getStatus() == ScoreSheetStatus.SUBMITTED) {
                skipped.add(row.getTeamId());
                rows.add(buildTeamRow(
                        sheet,
                        criteria,
                        teamName(row.getTeamId()),
                        slotNumber(boardId, row.getTeamId()),
                        ctx.board.getId(),
                        ctx.round.getId()));
                continue;
            }

            if (row.getGeneralFeedback() != null) {
                sheet.setGeneralFeedback(row.getGeneralFeedback());
            }

            if (row.getScores() != null) {
                Map<Long, ScoreItem> existing = scoreItemRepository.findByScoreSheetId(sheet.getId()).stream()
                        .collect(Collectors.toMap(ScoreItem::getCriteriaId, i -> i));
                for (ScoreItemInput input : row.getScores()) {
                    ScoreCriteria criterion = criteriaById.get(input.getCriteriaId());
                    if (criterion == null) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CRITERIA_NOT_IN_ROUND");
                    }
                    if (input.getScoreValue() != null) {
                        validateScoreRange(input.getScoreValue(), criterion);
                    }
                    if (input.getScoreValue() == null) {
                        continue;
                    }
                    ScoreItem item = existing.get(input.getCriteriaId());
                    if (item == null) {
                        item = ScoreItem.builder()
                                .scoreSheetId(sheet.getId())
                                .criteriaId(input.getCriteriaId())
                                .build();
                    }
                    item.setScoreValue(input.getScoreValue());
                    item.setComment(input.getComment());
                    scoreItemRepository.save(item);
                }
            }

            sheet.setUpdatedAt(OffsetDateTime.now());
            scoreSheetRepository.save(sheet);
            saved.add(row.getTeamId());
            rows.add(buildTeamRow(
                    sheet,
                    criteria,
                    teamName(row.getTeamId()),
                    slotNumber(boardId, row.getTeamId()),
                    ctx.board.getId(),
                    ctx.round.getId()));
        }

        return SaveMatrixResponse.builder()
                .savedTeamIds(saved)
                .skippedSubmittedTeamIds(skipped)
                .rows(rows)
                .build();
    }

    @Transactional
    public SubmitMatrixResponse submitScoreMatrix(Long boardId, SubmitMatrixRequest request) {
        CurrentUserPrincipal judge = requireJudge();
        BoardContext ctx = loadBoardContextForJudge(boardId, judge.getUserId());
        List<ScoreCriteria> criteria = requireCriteria(ctx.round.getId());

        List<BoardSlot> slots = sortedScorableSlotsWithTeams(boardId);
        if (slots.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "BOARD_REPOSITORIES_NOT_READY:[]");
        }
        List<Long> targetTeamIds = resolveSubmitTargets(request, slots);

        List<SubmittedSheetDto> submitted = new ArrayList<>();
        List<SubmitFailureDto> failed = new ArrayList<>();

        for (Long teamId : targetTeamIds) {
            try {
                ScoreSheet sheet = scoreSheetRepository
                        .findByBoardIdAndTeamIdAndJudgeId(boardId, teamId, judge.getUserId())
                        .orElseGet(() -> ensureDraftSheet(boardId, teamId, judge.getUserId(), ctx.assignment.getId()));

                if (sheet.getStatus() == ScoreSheetStatus.SUBMITTED
                        && request != null
                        && request.isSubmitAll()) {
                    continue;
                }

                submitSheetInternal(sheet, criteria);
                BigDecimal total = computeTotal(sheet.getId(), criteria);
                submitted.add(SubmittedSheetDto.builder()
                        .teamId(teamId)
                        .sheetId(sheet.getId())
                        .status(ScoreSheetStatus.SUBMITTED)
                        .submittedAt(sheet.getSubmittedAt())
                        .judgeTeamScore(total)
                        .build());
            } catch (ResponseStatusException ex) {
                failed.add(SubmitFailureDto.builder()
                        .teamId(teamId)
                        .errorCode(normalizeErrorCode(ex.getReason()))
                        .missingCriteriaIds(extractMissingCriteria(ex))
                        .build());
            }
        }

        return SubmitMatrixResponse.builder().submitted(submitted).failed(failed).build();
    }

    @Transactional(readOnly = true)
    public ScoreProgressResponse getScoreProgress(Long boardId) {
        BoardContext ctx = loadBoardContext(boardId);
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(ctx.round.getEventId());
        return buildScoreProgress(ctx);
    }

    @Transactional(readOnly = true)
    public EventScoreProgressResponse getEventScoreProgress(Long eventId) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        List<ScoreProgressResponse> boards = new ArrayList<>();
        for (Round round : ContestOrdering.sortRounds(roundRepository.findByEventId(eventId))) {
            for (Board board : ContestOrdering.sortBoards(boardRepository.findByRoundId(round.getId()))) {
                boards.add(buildScoreProgress(new BoardContext(board, round, null)));
            }
        }

        int teamCount = boards.stream().mapToInt(p -> p.getSummary().getTeamCount()).sum();
        int judgeCount = boards.stream().mapToInt(p -> p.getSummary().getJudgeCount()).sum();
        int expected = boards.stream().mapToInt(p -> p.getSummary().getExpectedSheets()).sum();
        int submitted = boards.stream().mapToInt(p -> p.getSummary().getSubmittedSheets()).sum();
        int draft = boards.stream().mapToInt(p -> p.getSummary().getDraftSheets()).sum();
        int missing = boards.stream().mapToInt(p -> p.getSummary().getMissingSheets()).sum();
        BigDecimal completion = expected == 0
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(submitted)
                        .multiply(BigDecimal.valueOf(100))
                        .divide(BigDecimal.valueOf(expected), 2, RoundingMode.HALF_UP);

        return EventScoreProgressResponse.builder()
                .eventId(eventId)
                .eventName(event.getName())
                .summary(ProgressSummaryDto.builder()
                        .teamCount(teamCount)
                        .judgeCount(judgeCount)
                        .expectedSheets(expected)
                        .submittedSheets(submitted)
                        .draftSheets(draft)
                        .missingSheets(missing)
                        .completionPercent(completion)
                        .build())
                .boards(boards)
                .boardsWithoutJudges(boards.stream()
                        .filter(p -> p.getSummary().getTeamCount() > 0 && p.getSummary().getJudgeCount() == 0)
                        .map(ScoreProgressResponse::getBoardId)
                        .toList())
                .boardsIncomplete(boards.stream()
                        .filter(p -> p.getSummary().getExpectedSheets() > 0
                                && p.getSummary().getCompletionPercent().compareTo(BigDecimal.valueOf(100)) < 0)
                        .map(ScoreProgressResponse::getBoardId)
                        .toList())
                .build();
    }

    private ScoreProgressResponse buildScoreProgress(BoardContext ctx) {
        Long boardId = ctx.board.getId();
        List<BoardSlot> slots = sortedSlotsWithTeams(boardId);
        Set<Long> scorableTeamIds = slots.stream()
                .map(BoardSlot::getTeamId)
                .filter(teamId -> scoringRepositoryGuardService.hasScorableRepositoryForBoard(boardId, teamId))
                .collect(Collectors.toSet());
        List<JudgeAssignment> judgeAssignments = judgeAssignmentRepository.findByBoardId(boardId);
        Set<Long> currentTeamIds = scorableTeamIds;
        Set<Long> displayTeamIds = slots.stream()
                .map(BoardSlot::getTeamId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Set<Long> currentJudgeIds = judgeAssignments.stream()
                .map(JudgeAssignment::getJudgeId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        List<ScoreSheet> sheets = scoreSheetRepository.findByBoardId(boardId).stream()
                .filter(sheet -> currentTeamIds.contains(sheet.getTeamId()))
                .filter(sheet -> currentJudgeIds.contains(sheet.getJudgeId()))
                .toList();
        List<ScoreCriteria> criteria = scoreCriteriaRepository.findByRoundIdOrderBySortOrderAsc(ctx.round.getId());

        int teamCount = displayTeamIds.size();
        int judgeCount = judgeAssignments.size();
        int expected = scorableTeamIds.size() * judgeCount;
        Set<String> submittedPairs = sheets.stream()
                .filter(s -> s.getStatus() == ScoreSheetStatus.SUBMITTED)
                .map(this::scoreSheetPairKey)
                .collect(Collectors.toSet());
        Set<String> draftPairs = sheets.stream()
                .filter(s -> s.getStatus() == ScoreSheetStatus.DRAFT)
                .map(this::scoreSheetPairKey)
                .collect(Collectors.toSet());
        Set<String> knownPairs = sheets.stream()
                .map(this::scoreSheetPairKey)
                .collect(Collectors.toSet());
        int submitted = submittedPairs.size();
        int draft = draftPairs.size();
        int missing = Math.max(0, expected - knownPairs.size());

        BigDecimal completion = expected == 0
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(submitted)
                        .multiply(BigDecimal.valueOf(100))
                        .divide(BigDecimal.valueOf(expected), 2, RoundingMode.HALF_UP);

        Map<String, ScoreSheet> sheetIndex = sheets.stream()
                .collect(Collectors.toMap(s -> s.getTeamId() + ":" + s.getJudgeId(), s -> s, (a, b) -> a));

        List<JudgeProgressDto> judgeProgress = judgeAssignments.stream()
                .map(ja -> {
                    User user = userRepository.findById(ja.getJudgeId()).orElse(null);
                    int sub = (int) sheets.stream()
                            .filter(s -> Objects.equals(s.getJudgeId(), ja.getJudgeId())
                                    && s.getStatus() == ScoreSheetStatus.SUBMITTED)
                            .map(ScoreSheet::getTeamId)
                            .distinct()
                            .count();
                    return JudgeProgressDto.builder()
                            .judgeId(ja.getJudgeId())
                            .fullName(user != null ? user.getFullName() : "Judge " + ja.getJudgeId())
                            .submittedCount(sub)
                            .totalTeams(scorableTeamIds.size())
                            .build();
                })
                .toList();

        List<TeamProgressDto> teamProgress = slots.stream()
                .map(slot -> {
                    boolean scorable = scorableTeamIds.contains(slot.getTeamId());
                    List<JudgeSheetStatusDto> judgeStatuses = judgeAssignments.stream()
                            .map(ja -> {
                                if (!scorable) {
                                    return JudgeSheetStatusDto.builder()
                                            .judgeId(ja.getJudgeId())
                                            .status("REPO_NOT_READY")
                                            .sheetId(null)
                                            .judgeTeamScore(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP))
                                            .build();
                                }
                                ScoreSheet sheet = sheetIndex.get(slot.getTeamId() + ":" + ja.getJudgeId());
                                String status = sheet == null ? "MISSING" : sheet.getStatus().name();
                                BigDecimal score = sheet != null && sheet.getStatus() == ScoreSheetStatus.SUBMITTED
                                        ? computeTotal(sheet.getId(), criteria)
                                        : null;
                                return JudgeSheetStatusDto.builder()
                                        .judgeId(ja.getJudgeId())
                                        .status(status)
                                        .sheetId(sheet != null ? sheet.getId() : null)
                                        .judgeTeamScore(score)
                                        .build();
                            })
                            .toList();
                    int subCount = (int) judgeStatuses.stream().filter(j -> "SUBMITTED".equals(j.getStatus())).count();
                    return TeamProgressDto.builder()
                            .teamId(slot.getTeamId())
                            .teamName(teamName(slot.getTeamId()))
                            .judges(judgeStatuses)
                            .submittedJudgeCount(subCount)
                            .requiredJudgeCount(scorable ? judgeCount : 0)
                            .scoringStatus(scorable ? "SCORABLE" : "REPO_NOT_READY")
                            .ineligibleReason(scorable ? null : "Repository chưa sẵn sàng nên đội được tính 0 điểm.")
                            .build();
                })
                .toList();

        return ScoreProgressResponse.builder()
                .boardId(boardId)
                .boardName(ctx.board.getName())
                .roundId(ctx.round.getId())
                .summary(ProgressSummaryDto.builder()
                        .teamCount(teamCount)
                        .judgeCount(judgeCount)
                        .expectedSheets(expected)
                        .submittedSheets(submitted)
                        .draftSheets(draft)
                        .missingSheets(missing)
                        .completionPercent(completion)
                        .build())
                .judges(judgeProgress)
                .teams(teamProgress)
                .build();
    }

    @Transactional
    public ScoringReminderResponse sendScoringReminder(Long boardId) {
        ScoreProgressResponse progress = getScoreProgress(boardId);
        int submitted = progress.getSummary().getSubmittedSheets();
        int expected = progress.getSummary().getExpectedSheets();
        if (expected == 0 || submitted >= expected) {
            return ScoringReminderResponse.builder()
                    .notifiedJudgeCount(0)
                    .notifiedJudgeNames(List.of())
                    .organizerNotified(false)
                    .build();
        }
        BoardContext ctx = loadBoardContext(boardId);
        Event event = eventRepository.findById(ctx.round.getEventId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));

        List<String> notifiedNames = new ArrayList<>();
        for (JudgeProgressDto judge : progress.getJudges()) {
            if (judge.getSubmittedCount() < judge.getTotalTeams()) {
                boolean sent = notificationService.notifyJudgeScoringReminder(
                        judge.getJudgeId(),
                        ctx.board,
                        ctx.round,
                        event,
                        judge.getSubmittedCount(),
                        judge.getTotalTeams());
                if (sent) {
                    notifiedNames.add(judge.getFullName());
                }
            }
        }

        boolean organizerNotified = false;
        if (event.getCreatedBy() != null) {
            notificationService.notifyOrganizerScoringIncomplete(event, ctx.board, submitted, expected);
            organizerNotified = true;
        }

        return ScoringReminderResponse.builder()
                .notifiedJudgeCount(notifiedNames.size())
                .notifiedJudgeNames(notifiedNames)
                .organizerNotified(organizerNotified)
                .build();
    }

    private void submitSheetInternal(ScoreSheet sheet, List<ScoreCriteria> criteria) {
        assertTeamScorable(sheet.getTeamId());

        Map<Long, ScoreItem> items = scoreItemRepository.findByScoreSheetId(sheet.getId()).stream()
                .collect(Collectors.toMap(ScoreItem::getCriteriaId, i -> i));
        List<Long> missing = new ArrayList<>();
        for (ScoreCriteria criterion : criteria) {
            ScoreItem item = items.get(criterion.getId());
            if (item == null || item.getScoreValue() == null) {
                missing.add(criterion.getId());
                continue;
            }
            validateScoreRange(item.getScoreValue(), criterion);
        }
        if (!missing.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INCOMPLETE_SCORE_SHEET:" + missing);
        }

        sheet.setStatus(ScoreSheetStatus.SUBMITTED);
        sheet.setSubmittedAt(OffsetDateTime.now());
        sheet.setUpdatedAt(OffsetDateTime.now());
        scoreSheetRepository.save(sheet);
    }

    private List<Long> resolveSubmitTargets(SubmitMatrixRequest request, List<BoardSlot> slots) {
        if (request != null && request.isSubmitAll()) {
            return slots.stream().map(BoardSlot::getTeamId).toList();
        }
        if (request != null && request.getTeamIds() != null && !request.getTeamIds().isEmpty()) {
            return request.getTeamIds();
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "TEAM_IDS_REQUIRED");
    }

    private ScoreMatrixResponse buildMatrixResponse(
            BoardContext ctx, List<ScoreCriteria> criteria, List<BoardSlot> slots, Long judgeId) {
        List<MatrixTeamRowResponse> teams = slots.stream()
                .map(slot -> {
                    ScoreSheet sheet = scoreSheetRepository
                            .findByBoardIdAndTeamIdAndJudgeId(ctx.board.getId(), slot.getTeamId(), judgeId)
                            .orElse(null);
                    if (sheet == null) {
                        return null;
                    }
                    return buildTeamRow(
                            sheet,
                            criteria,
                            teamName(slot.getTeamId()),
                            slot.getTeamNumber(),
                            ctx.board.getId(),
                            ctx.round.getId());
                })
                .filter(Objects::nonNull)
                .toList();

        int draft = (int) teams.stream().filter(t -> t.getStatus() == ScoreSheetStatus.DRAFT).count();
        int submitted = (int) teams.stream().filter(t -> t.getStatus() == ScoreSheetStatus.SUBMITTED).count();

        User judgeUser = userRepository.findById(judgeId).orElse(null);

        return ScoreMatrixResponse.builder()
                .board(BoardBriefDto.builder()
                        .id(ctx.board.getId())
                        .name(ctx.board.getName())
                        .roundId(ctx.round.getId())
                        .roundName(ctx.round.getName())
                        .build())
                .judge(JudgeBriefDto.builder()
                        .id(judgeId)
                        .fullName(judgeUser != null ? judgeUser.getFullName() : "Judge")
                        .build())
                .criteria(criteria.stream().map(this::toCriteriaResponse).toList())
                .teams(teams)
                .summary(MatrixSummaryDto.builder()
                        .teamCount(teams.size())
                        .draftCount(draft)
                        .submittedCount(submitted)
                        .build())
                .build();
    }

    private MatrixTeamRowResponse buildTeamRow(
            ScoreSheet sheet,
            List<ScoreCriteria> criteria,
            String teamName,
            Integer slotNumber,
            Long boardId,
            Long roundId) {
        Map<Long, ScoreCriteria> byId = criteria.stream().collect(Collectors.toMap(ScoreCriteria::getId, c -> c));
        List<ScoreItem> items = scoreItemRepository.findByScoreSheetId(sheet.getId());
        List<ScoreItemResponse> scores = items.stream()
                .map(item -> {
                    ScoreCriteria c = byId.get(item.getCriteriaId());
                    return ScoreItemResponse.builder()
                            .criteriaId(item.getCriteriaId())
                            .criteriaCode(c != null ? c.getCode() : null)
                            .scoreValue(item.getScoreValue())
                            .comment(item.getComment())
                            .build();
                })
                .toList();

        return MatrixTeamRowResponse.builder()
                .teamId(sheet.getTeamId())
                .teamName(teamName)
                .repositoryUrl(repositoryUrlForTeam(sheet.getTeamId(), boardId, roundId))
                .slotNumber(slotNumber)
                .sheetId(sheet.getId())
                .status(sheet.getStatus())
                .generalFeedback(sheet.getGeneralFeedback())
                .editable(sheet.getStatus() != ScoreSheetStatus.SUBMITTED)
                .scores(scores)
                .computed(ComputedScoreDto.builder()
                        .judgeTeamScore(computeTotal(sheet.getId(), criteria))
                        .formula("SUM(scoreValue * weight) / 10")
                        .build())
                .build();
    }

    private ScoreSheet ensureDraftSheet(Long boardId, Long teamId, Long judgeId, Long assignmentId) {
        assertTeamInBoard(boardId, teamId);
        assertTeamScorable(teamId);
        scoringRepositoryGuardService.requireTeamRepositoryReady(boardId, teamId);
        return scoreSheetRepository.findByBoardIdAndTeamIdAndJudgeId(boardId, teamId, judgeId)
                .orElseGet(() -> {
                    OffsetDateTime now = OffsetDateTime.now();
                    ScoreSheet sheet = ScoreSheet.builder()
                            .boardId(boardId)
                            .teamId(teamId)
                            .judgeId(judgeId)
                            .judgeAssignmentId(assignmentId)
                            .status(ScoreSheetStatus.DRAFT)
                            .createdAt(now)
                            .updatedAt(now)
                            .build();
                    return scoreSheetRepository.save(sheet);
                });
    }

    private BigDecimal computeTotal(Long sheetId, List<ScoreCriteria> criteria) {
        Map<Long, BigDecimal> weights = criteria.stream()
                .collect(Collectors.toMap(ScoreCriteria::getId, ScoreCriteria::getWeight));
        List<ScoreItem> items = scoreItemRepository.findByScoreSheetId(sheetId);
        BigDecimal sum = BigDecimal.ZERO;
        boolean any = false;
        for (ScoreItem item : items) {
            if (item.getScoreValue() == null) {
                continue;
            }
            BigDecimal weight = weights.get(item.getCriteriaId());
            if (weight == null) {
                continue;
            }
            sum = sum.add(item.getScoreValue().multiply(weight));
            any = true;
        }
        if (!any) {
            return null;
        }
        return sum.divide(BigDecimal.TEN, 2, RoundingMode.HALF_UP);
    }

    private void replaceRubricCriteria(Long roundId, List<CriteriaRequestItem> items) {
        List<ScoreCriteria> existing = scoreCriteriaRepository.findByRoundIdOrderBySortOrderAsc(roundId);
        Map<String, ScoreCriteria> byCode = new HashMap<>();
        for (ScoreCriteria criterion : existing) {
            byCode.put(criterion.getCode(), criterion);
        }

        Set<String> requestedCodes = new HashSet<>();
        OffsetDateTime now = OffsetDateTime.now();
        int order = 0;
        for (CriteriaRequestItem item : items) {
            String code = item.getCode().trim();
            requestedCodes.add(code);
            int sortOrder = item.getSortOrder() != null ? item.getSortOrder() : order++;
            ScoreCriteria entity = byCode.get(code);
            if (entity != null) {
                applyCriteriaItem(entity, item, sortOrder);
                scoreCriteriaRepository.save(entity);
            } else {
                scoreCriteriaRepository.save(buildCriteriaEntity(roundId, item, sortOrder, now));
            }
        }

        for (ScoreCriteria orphan : existing) {
            if (!requestedCodes.contains(orphan.getCode())) {
                scoreItemRepository.deleteByCriteriaId(orphan.getId());
                scoreCriteriaRepository.delete(orphan);
            }
        }
    }

    private void insertRubricCriteria(Long roundId, List<CriteriaRequestItem> items) {
        OffsetDateTime now = OffsetDateTime.now();
        int order = 0;
        for (CriteriaRequestItem item : items) {
            int sortOrder = item.getSortOrder() != null ? item.getSortOrder() : order++;
            scoreCriteriaRepository.save(buildCriteriaEntity(roundId, item, sortOrder, now));
        }
    }

    private ScoreCriteria buildCriteriaEntity(
            Long roundId, CriteriaRequestItem item, int sortOrder, OffsetDateTime createdAt) {
        ScoreCriteria entity = ScoreCriteria.builder()
                .roundId(roundId)
                .code(item.getCode().trim())
                .createdAt(createdAt)
                .build();
        applyCriteriaItem(entity, item, sortOrder);
        return entity;
    }

    private void applyCriteriaItem(ScoreCriteria entity, CriteriaRequestItem item, int sortOrder) {
        entity.setName(item.getName().trim());
        entity.setDescription(item.getDescription());
        entity.setWeight(item.getWeight());
        entity.setMinScore(item.getMinScore());
        entity.setMaxScore(item.getMaxScore());
        entity.setSortOrder(sortOrder);
        entity.setLevelDescriptors(LevelDescriptorNormalizer.normalize(item.getLevelDescriptors()));
    }

    private void normalizeRubricLevelDescriptors(SaveRubricRequest request) {
        for (CriteriaRequestItem item : request.getCriteria()) {
            item.setLevelDescriptors(LevelDescriptorNormalizer.normalize(item.getLevelDescriptors()));
        }
    }

    private void validateRubricRequest(SaveRubricRequest request) {
        Set<String> codes = new HashSet<>();
        Set<String> names = new HashSet<>();
        BigDecimal totalWeight = BigDecimal.ZERO;

        for (CriteriaRequestItem item : request.getCriteria()) {
            if (!StringUtils.hasText(item.getCode())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CRITERIA_CODE_REQUIRED");
            }
            if (!codes.add(item.getCode().trim())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "DUPLICATE_CRITERIA");
            }
            if (!names.add(item.getName().trim())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "DUPLICATE_CRITERIA");
            }
            if (item.getLevelDescriptors() == null || item.getLevelDescriptors().size() != 4) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_LEVEL_DESCRIPTORS");
            }
            if (item.getMaxScore().compareTo(item.getMinScore()) <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_SCORE_RANGE");
            }
            if (item.getWeight().compareTo(BigDecimal.ZERO) <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_WEIGHT");
            }
            totalWeight = totalWeight.add(item.getWeight());
        }

        if (totalWeight.subtract(WEIGHT_TARGET).abs().compareTo(WEIGHT_TOLERANCE) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_WEIGHT_SUM");
        }
    }

    private boolean isRubricLocked(Long roundId) {
        List<Board> boards = boardRepository.findByRoundId(roundId);
        for (Board board : boards) {
            if (scoreSheetRepository.existsByBoardIdAndStatus(board.getId(), ScoreSheetStatus.SUBMITTED)) {
                return true;
            }
        }
        return false;
    }

    private List<ScoreCriteria> requireCriteria(Long roundId) {
        List<ScoreCriteria> criteria = scoreCriteriaRepository.findByRoundIdOrderBySortOrderAsc(roundId);
        if (criteria.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "RUBRIC_NOT_CONFIGURED");
        }
        return criteria;
    }

    private void validateScoreRange(BigDecimal score, ScoreCriteria criterion) {
        if (score.compareTo(criterion.getMinScore()) < 0 || score.compareTo(criterion.getMaxScore()) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "SCORE_OUT_OF_RANGE");
        }
    }

    private void assertTeamInBoard(Long boardId, Long teamId) {
        boolean inBoard = boardSlotRepository.findByBoardId(boardId).stream()
                .anyMatch(slot -> Objects.equals(slot.getTeamId(), teamId));
        if (!inBoard) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "TEAM_NOT_IN_BOARD");
        }
    }

    private void assertTeamScorable(Long teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "TEAM_NOT_FOUND"));
        if (team.getStatus() != TeamStatus.CONFIRMED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "TEAM_NOT_CONFIRMED");
        }
    }

    private List<BoardSlot> sortedSlotsWithTeams(Long boardId) {
        List<BoardSlot> occupiedSlots = boardSlotRepository.findByBoardId(boardId).stream()
                .filter(slot -> slot.getTeamId() != null)
                .toList();
        Set<Long> confirmedTeamIds = teamRepository.findAllById(
                        occupiedSlots.stream().map(BoardSlot::getTeamId).toList())
                .stream()
                .filter(team -> team.getStatus() == TeamStatus.CONFIRMED)
                .map(Team::getId)
                .collect(Collectors.toSet());
        return occupiedSlots.stream()
                .filter(slot -> confirmedTeamIds.contains(slot.getTeamId()))
                .sorted(Comparator.comparing(BoardSlot::getTeamNumber))
                .toList();
    }

    private List<BoardSlot> sortedScorableSlotsWithTeams(Long boardId) {
        return sortedSlotsWithTeams(boardId).stream()
                .filter(slot -> scoringRepositoryGuardService.hasScorableRepositoryForBoard(boardId, slot.getTeamId()))
                .toList();
    }

    private Integer slotNumber(Long boardId, Long teamId) {
        return boardSlotRepository.findByBoardId(boardId).stream()
                .filter(s -> Objects.equals(s.getTeamId(), teamId))
                .map(BoardSlot::getTeamNumber)
                .findFirst()
                .orElse(null);
    }

    private String teamName(Long teamId) {
        return teamRepository.findById(teamId).map(Team::getName).orElse("Team " + teamId);
    }

    private RubricResponse buildRubricResponse(Long roundId, List<ScoreCriteria> criteria) {
        BigDecimal total = criteria.stream()
                .map(ScoreCriteria::getWeight)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return RubricResponse.builder()
                .roundId(roundId)
                .criteria(criteria.stream().map(this::toCriteriaResponse).toList())
                .totalWeight(total)
                .locked(isRubricLocked(roundId))
                .build();
    }

    private CriteriaRequestItem toCriteriaRequestItem(ScoreCriteria entity) {
        CriteriaRequestItem item = new CriteriaRequestItem();
        item.setCode(entity.getCode());
        item.setName(entity.getName());
        item.setDescription(entity.getDescription());
        item.setWeight(entity.getWeight());
        item.setMinScore(entity.getMinScore());
        item.setMaxScore(entity.getMaxScore());
        item.setSortOrder(entity.getSortOrder());
        item.setLevelDescriptors(LevelDescriptorNormalizer.normalize(entity.getLevelDescriptors()));
        HackathonRubricDefaults.enrichBlankDescriptions(item);
        return item;
    }

    private CriteriaResponse toCriteriaResponse(ScoreCriteria entity) {
        CriteriaResponse response = CriteriaResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .weight(entity.getWeight())
                .minScore(entity.getMinScore())
                .maxScore(entity.getMaxScore())
                .description(entity.getDescription())
                .sortOrder(entity.getSortOrder())
                .levelDescriptors(LevelDescriptorNormalizer.normalize(entity.getLevelDescriptors()))
                .build();
        CriteriaRequestItem enrichSource = new CriteriaRequestItem();
        enrichSource.setCode(response.getCode());
        enrichSource.setDescription(response.getDescription());
        enrichSource.setLevelDescriptors(response.getLevelDescriptors());
        HackathonRubricDefaults.enrichBlankDescriptions(enrichSource);
        response.setDescription(enrichSource.getDescription());
        response.setLevelDescriptors(enrichSource.getLevelDescriptors());
        return response;
    }

    private BoardContext loadBoardContext(Long boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "BOARD_NOT_FOUND"));
        Round round = roundRepository.findById(board.getRoundId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ROUND_NOT_FOUND"));
        return new BoardContext(board, round, null);
    }

    private BoardContext loadBoardContextForJudge(Long boardId, Long judgeId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "BOARD_NOT_FOUND"));
        Round round = roundRepository.findById(board.getRoundId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ROUND_NOT_FOUND"));
        contestPhaseGuardService.assertEventAllowsJudgeScoring(round.getEventId());
        JudgeAssignment assignment = judgeAssignmentRepository.findByBoardIdAndJudgeId(boardId, judgeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "JUDGE_NOT_ASSIGNED"));
        return new BoardContext(board, round, assignment);
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

    private String normalizeErrorCode(String reason) {
        if (reason == null || reason.isBlank()) {
            return "UNKNOWN";
        }
        if (reason.startsWith("INCOMPLETE_SCORE_SHEET")) {
            return "INCOMPLETE_SCORE_SHEET";
        }
        return reason;
    }

    private List<Long> extractMissingCriteria(ResponseStatusException ex) {
        String reason = ex.getReason();
        if (reason != null && reason.startsWith("INCOMPLETE_SCORE_SHEET:")) {
            String tail = reason.substring("INCOMPLETE_SCORE_SHEET:".length());
            if (tail.isBlank()) {
                return List.of();
            }
            List<Long> ids = new ArrayList<>();
            for (String part : tail.replace("[", "").replace("]", "").split(",")) {
                if (!part.isBlank()) {
                    ids.add(Long.parseLong(part.trim()));
                }
            }
            return ids;
        }
        return List.of();
    }

    private String repositoryUrlForTeam(Long teamId, Long boardId, Long roundId) {
        return teamRepositoryEntityRepository.findAllByTeamId(teamId).stream()
                .filter(entity -> java.util.Objects.equals(entity.getBoardId(), boardId)
                        || (entity.getBoardId() == null && java.util.Objects.equals(entity.getRoundId(), roundId)))
                .filter(entity -> StringUtils.hasText(entity.getRepositoryUrl()))
                .filter(scoringRepositoryGuardService::isScorableRepository)
                .sorted(Comparator
                        .comparing((com.seal.hackathon.aireview.entity.TeamRepository entity) ->
                                repositoryScopePriority(entity, boardId, roundId))
                        .reversed()
                        .thenComparing(
                                com.seal.hackathon.aireview.entity.TeamRepository::getUpdatedAt,
                                Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(
                                com.seal.hackathon.aireview.entity.TeamRepository::getId,
                                Comparator.nullsLast(Comparator.reverseOrder())))
                .map(entity -> entity.getRepositoryUrl())
                .findFirst()
                .orElse(null);
    }

    private int repositoryScopePriority(
            com.seal.hackathon.aireview.entity.TeamRepository entity,
            Long boardId,
            Long roundId) {
        if (java.util.Objects.equals(entity.getBoardId(), boardId)) {
            return 100;
        }
        if (entity.getBoardId() == null && java.util.Objects.equals(entity.getRoundId(), roundId)) {
            return 50;
        }
        return 0;
    }

    private String scoreSheetPairKey(ScoreSheet sheet) {
        return sheet.getTeamId() + ":" + sheet.getJudgeId();
    }

    private record BoardContext(Board board, Round round, JudgeAssignment assignment) {}
}
