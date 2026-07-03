package com.seal.hackathon.ranking.service;

import com.seal.hackathon.common.security.OrganizerAuthorizationService;
import com.seal.hackathon.common.util.ContestOrdering;
import com.seal.hackathon.common.enums.ScoreSheetStatus;
import com.seal.hackathon.common.enums.TeamStatus;
import com.seal.hackathon.contest.entity.Board;
import com.seal.hackathon.contest.entity.BoardSlot;
import com.seal.hackathon.contest.entity.Event;
import com.seal.hackathon.contest.entity.Round;
import com.seal.hackathon.contest.repository.BoardRepository;
import com.seal.hackathon.contest.repository.BoardSlotRepository;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.contest.repository.RoundRepository;
import com.seal.hackathon.authprofile.security.CurrentUserPrincipal;
import com.seal.hackathon.authprofile.security.CurrentUserProvider;
import com.seal.hackathon.assignment.repository.JudgeAssignmentRepository;
import com.seal.hackathon.notification.service.NotificationService;
import com.seal.hackathon.registration.service.AuditLogWriter;
import com.seal.hackathon.contest.service.ContestPhaseGuardService;
import com.seal.hackathon.ranking.dto.BoardRankingResponse;
import com.seal.hackathon.ranking.dto.CalculateRankingResponse;
import com.seal.hackathon.ranking.dto.EventRankingsResponse;
import com.seal.hackathon.ranking.dto.PublicEventResultsResponse;
import com.seal.hackathon.ranking.dto.RankingTeamEntryDto;
import com.seal.hackathon.ranking.entity.RankingResult;
import com.seal.hackathon.ranking.repository.RankingResultRepository;
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.repository.TeamRepository;
import com.seal.hackathon.scoring.entity.ScoreCriteria;
import com.seal.hackathon.scoring.entity.ScoreItem;
import com.seal.hackathon.scoring.entity.ScoreSheet;
import com.seal.hackathon.scoring.repository.ScoreCriteriaRepository;
import com.seal.hackathon.scoring.repository.ScoreItemRepository;
import com.seal.hackathon.scoring.repository.ScoreSheetRepository;
import com.seal.hackathon.scoring.service.ScoringRepositoryGuardService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class RankingService {

    private final RankingResultRepository rankingResultRepository;
    private final BoardRepository boardRepository;
    private final BoardSlotRepository boardSlotRepository;
    private final RoundRepository roundRepository;
    private final EventRepository eventRepository;
    private final TeamRepository teamRepository;
    private final ScoreCriteriaRepository scoreCriteriaRepository;
    private final ScoreSheetRepository scoreSheetRepository;
    private final ScoreItemRepository scoreItemRepository;
    private final JudgeAssignmentRepository judgeAssignmentRepository;
    private final OrganizerAuthorizationService organizerAuthorizationService;
    private final NotificationService notificationService;
    private final PublishReadinessService publishReadinessService;
    private final CurrentUserProvider currentUserProvider;
    private final AuditLogWriter auditLogWriter;
    private final ContestPhaseGuardService contestPhaseGuardService;
    private final ScoringRepositoryGuardService scoringRepositoryGuardService;

    @Transactional(readOnly = true)
    public BoardRankingResponse getBoardRanking(Long boardId) {
        organizerAuthorizationService.requireBoardOwnedByCurrentOrganizer(boardId);
        return buildBoardRankingResponse(loadBoard(boardId), false);
    }

    @Transactional(readOnly = true)
    public EventRankingsResponse getEventRankings(Long eventId) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        List<BoardRankingResponse> boards = new ArrayList<>();
        for (Round round : ContestOrdering.sortRounds(roundRepository.findByEventId(eventId))) {
            for (Board board : ContestOrdering.sortBoards(boardRepository.findByRoundId(round.getId()))) {
                boards.add(buildBoardRankingResponse(board, false));
            }
        }
        boolean anyPublished = boards.stream().anyMatch(BoardRankingResponse::isPublished);
        return EventRankingsResponse.builder()
                .eventId(eventId)
                .eventName(event.getName())
                .anyPublished(anyPublished)
                .boards(boards)
                .build();
    }

    @Transactional(readOnly = true)
    public PublicEventResultsResponse getPublicEventResults(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        List<BoardRankingResponse> publishedBoards = new ArrayList<>();
        OffsetDateTime latestPublish = null;
        for (Round round : ContestOrdering.sortRounds(roundRepository.findByEventId(eventId))) {
            for (Board board : ContestOrdering.sortBoards(boardRepository.findByRoundId(round.getId()))) {
                if (!rankingResultRepository.existsByBoardIdAndPublishedAtIsNotNull(board.getId())) {
                    continue;
                }
                BoardRankingResponse ranking = buildBoardRankingResponse(board, true);
                publishedBoards.add(ranking);
                if (ranking.getPublishedAt() != null
                        && (latestPublish == null || ranking.getPublishedAt().isAfter(latestPublish))) {
                    latestPublish = ranking.getPublishedAt();
                }
            }
        }
        if (publishedBoards.isEmpty()) {
            return PublicEventResultsResponse.builder()
                    .eventId(eventId)
                    .eventName(event.getName())
                    .published(false)
                    .boards(List.of())
                    .build();
        }
        return PublicEventResultsResponse.builder()
                .eventId(eventId)
                .eventName(event.getName())
                .published(true)
                .publishedAt(latestPublish)
                .boards(publishedBoards)
                .build();
    }

    @Transactional
    public BoardRankingResponse calculateBoardRanking(Long boardId, boolean force) {
        organizerAuthorizationService.requireBoardOwnedByCurrentOrganizer(boardId);
        Board board = loadBoard(boardId);
        contestPhaseGuardService.assertRoundAllowsRankingCalculation(board.getRoundId());
        if (rankingResultRepository.existsByBoardIdAndPublishedAtIsNotNull(boardId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "RANKING_PUBLISHED");
        }
        persistBoardRanking(board);
        return buildBoardRankingResponse(board, false);
    }

    @Transactional
    public CalculateRankingResponse calculateRoundRanking(Long roundId, boolean force) {
        Round round = roundRepository.findById(roundId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Round not found"));
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(round.getEventId());
        contestPhaseGuardService.assertRoundAllowsRankingCalculation(roundId);
        int boardsCalculated = 0;
        int teamsRanked = 0;
        for (Board board : ContestOrdering.sortBoards(boardRepository.findByRoundId(roundId))) {
            if (rankingResultRepository.existsByBoardIdAndPublishedAtIsNotNull(board.getId())) {
                if (force) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "RANKING_PUBLISHED:" + board.getId());
                }
                continue;
            }
            BoardRankingResponse result = persistBoardRanking(board);
            boardsCalculated++;
            teamsRanked += result.getTeamCount();
        }
        return CalculateRankingResponse.builder()
                .boardsCalculated(boardsCalculated)
                .teamsRanked(teamsRanked)
                .message(boardsCalculated == 0 ? "NO_BOARDS_CALCULATED" : "OK")
                .build();
    }

    @Transactional
    public BoardRankingResponse publishBoardRanking(Long boardId) {
        organizerAuthorizationService.requireBoardOwnedByCurrentOrganizer(boardId);
        publishReadinessService.requireBoardReadyToPublish(boardId);
        Board board = loadBoard(boardId);
        if (!rankingResultRepository.existsByBoardId(boardId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "RANKING_NOT_CALCULATED");
        }
        OffsetDateTime now = OffsetDateTime.now();
        List<RankingResult> rows = rankingResultRepository.findByBoardIdOrderByRankAsc(boardId);
        for (RankingResult row : rows) {
            row.setPublishedAt(now);
            rankingResultRepository.save(row);
        }
        Round round = roundRepository.findById(board.getRoundId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Round not found"));
        Event event = eventRepository.findById(round.getEventId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        notificationService.notifyRankingPublished(event, board, rows);
        CurrentUserPrincipal actor = currentUserProvider.getCurrentUser();
        auditLogWriter.write(
                actor.getUserId(),
                actor.getEmail(),
                "RANKING_PUBLISHED",
                "Board",
                boardId,
                null,
                "{\"boardId\":" + boardId + ",\"teamCount\":" + rows.size() + "}");
        return buildBoardRankingResponse(board, true);
    }

    @Transactional
    public CalculateRankingResponse publishEventRankings(Long eventId) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        int publishedBoards = 0;
        int newlyPublishedBoards = 0;
        int teamsPublished = 0;
        for (Round round : ContestOrdering.sortRounds(roundRepository.findByEventId(eventId))) {
            for (Board board : ContestOrdering.sortBoards(boardRepository.findByRoundId(round.getId()))) {
                if (!rankingResultRepository.existsByBoardId(board.getId())) {
                    continue;
                }
                if (rankingResultRepository.existsByBoardIdAndPublishedAtIsNotNull(board.getId())) {
                    publishedBoards++;
                    teamsPublished += rankingResultRepository.findByBoardIdOrderByRankAsc(board.getId()).size();
                    continue;
                }
                BoardRankingResponse published = publishBoardRanking(board.getId());
                publishedBoards++;
                newlyPublishedBoards++;
                teamsPublished += published.getTeamCount();
            }
        }
        if (publishedBoards == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "RANKING_NOT_CALCULATED");
        }
        CurrentUserPrincipal actor = currentUserProvider.getCurrentUser();
        auditLogWriter.write(
                actor.getUserId(),
                actor.getEmail(),
                "EVENT_RANKINGS_PUBLISHED",
                "Event",
                eventId,
                null,
                "{\"eventId\":" + eventId + ",\"boardsPublished\":" + publishedBoards + ",\"newlyPublished\":" + newlyPublishedBoards + "}");
        return CalculateRankingResponse.builder()
                .boardsCalculated(publishedBoards)
                .teamsRanked(teamsPublished)
                .newlyPublishedBoards(newlyPublishedBoards)
                .message(newlyPublishedBoards == 0 ? "ALREADY_PUBLISHED" : "PUBLISHED")
                .build();
    }

    private BoardRankingResponse persistBoardRanking(Board board) {
        scoringRepositoryGuardService.requireBoardRepositoriesReady(board.getId());
        Round round = roundRepository.findById(board.getRoundId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Round not found"));
        List<ScoreCriteria> criteria = scoreCriteriaRepository.findByRoundIdOrderBySortOrderAsc(round.getId());
        if (criteria.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "RUBRIC_NOT_CONFIGURED");
        }
        requireBoardScoringComplete(board);

        List<ScoredTeam> scoredTeams = new ArrayList<>();
        for (BoardSlot slot : boardSlotRepository.findByBoardId(board.getId())) {
            if (slot.getTeamId() == null) {
                continue;
            }
            Team team = teamRepository.findById(slot.getTeamId()).orElse(null);
            if (team == null || team.getStatus() == TeamStatus.DISQUALIFIED) {
                continue;
            }
            List<ScoreSheet> sheets = scoreSheetRepository.findByBoardIdAndTeamId(board.getId(), slot.getTeamId())
                    .stream()
                    .filter(s -> s.getStatus() == ScoreSheetStatus.SUBMITTED)
                    .toList();
            if (sheets.isEmpty()) {
                continue;
            }
            List<BigDecimal> judgeScores = new ArrayList<>();
            for (ScoreSheet sheet : sheets) {
                BigDecimal total = computeJudgeTeamScore(sheet.getId(), criteria);
                if (total != null) {
                    judgeScores.add(total);
                }
            }
            if (judgeScores.isEmpty()) {
                continue;
            }
            BigDecimal average = average(judgeScores);
            scoredTeams.add(new ScoredTeam(
                    team.getId(),
                    team.getName(),
                    slot.getTeamNumber(),
                    average,
                    judgeScores.size()));
        }

        scoredTeams.sort(Comparator
                .comparing(ScoredTeam::averageScore, Comparator.reverseOrder())
                .thenComparing(ScoredTeam::teamName, String.CASE_INSENSITIVE_ORDER));

        rankingResultRepository.deleteByBoardId(board.getId());
        rankingResultRepository.flush();
        OffsetDateTime now = OffsetDateTime.now();
        int rank = 0;
        BigDecimal previousScore = null;
        for (int i = 0; i < scoredTeams.size(); i++) {
            ScoredTeam scored = scoredTeams.get(i);
            if (previousScore == null || scored.averageScore().compareTo(previousScore) != 0) {
                rank = i + 1;
                previousScore = scored.averageScore();
            }
            rankingResultRepository.save(RankingResult.builder()
                    .roundId(round.getId())
                    .boardId(board.getId())
                    .teamId(scored.teamId())
                    .rank(rank)
                    .averageScore(scored.averageScore())
                    .calculatedAt(now)
                    .publishedAt(null)
                    .build());
        }

        return buildBoardRankingResponse(board, false);
    }

    private void requireBoardScoringComplete(Board board) {
        int judgeCount = judgeAssignmentRepository.findByBoardId(board.getId()).size();
        if (judgeCount == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "SCORING_NOT_COMPLETE:NO_JUDGES");
        }
        List<Long> scorableTeamIds = boardSlotRepository.findByBoardId(board.getId()).stream()
                .map(BoardSlot::getTeamId)
                .filter(id -> id != null)
                .filter(teamId -> teamRepository.findById(teamId)
                        .map(team -> team.getStatus() != TeamStatus.DISQUALIFIED)
                        .orElse(false))
                .toList();
        if (scorableTeamIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "SCORING_NOT_COMPLETE:NO_TEAMS");
        }
        int expected = scorableTeamIds.size() * judgeCount;
        int submitted = (int) scoreSheetRepository.findByBoardId(board.getId()).stream()
                .filter(sheet -> scorableTeamIds.contains(sheet.getTeamId()))
                .filter(sheet -> sheet.getStatus() == ScoreSheetStatus.SUBMITTED)
                .count();
        if (submitted < expected) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "SCORING_NOT_COMPLETE:" + submitted + "/" + expected);
        }
    }

    private BoardRankingResponse buildBoardRankingResponse(Board board, boolean publishedOnly) {
        Round round = roundRepository.findById(board.getRoundId()).orElse(null);
        Event event = round != null && round.getEventId() != null
                ? eventRepository.findById(round.getEventId()).orElse(null)
                : null;
        List<RankingResult> rows = rankingResultRepository.findByBoardIdOrderByRankAsc(board.getId());
        if (publishedOnly) {
            rows = rows.stream().filter(r -> r.getPublishedAt() != null).toList();
        }
        Map<Long, Team> teamsById = teamRepository.findAllById(
                        rows.stream().map(RankingResult::getTeamId).toList())
                .stream()
                .collect(Collectors.toMap(Team::getId, t -> t));
        Map<Long, Integer> slotByTeam = boardSlotRepository.findByBoardId(board.getId()).stream()
                .filter(s -> s.getTeamId() != null)
                .collect(Collectors.toMap(BoardSlot::getTeamId, BoardSlot::getTeamNumber, (a, b) -> a));

        List<RankingTeamEntryDto> entries = rows.stream()
                .map(row -> {
                    Team team = teamsById.get(row.getTeamId());
                    int judgeCount = countSubmittedJudges(board.getId(), row.getTeamId());
                    return RankingTeamEntryDto.builder()
                            .rank(row.getRank())
                            .teamId(row.getTeamId())
                            .teamName(team != null ? team.getName() : "Team #" + row.getTeamId())
                            .slotNumber(slotByTeam.get(row.getTeamId()))
                            .averageScore(row.getAverageScore())
                            .submittedJudgeCount(judgeCount)
                            .build();
                })
                .toList();

        boolean published = rows.stream().anyMatch(r -> r.getPublishedAt() != null);
        OffsetDateTime calculatedAt = rows.stream()
                .map(RankingResult::getCalculatedAt)
                .filter(java.util.Objects::nonNull)
                .findFirst()
                .orElse(null);
        OffsetDateTime publishedAt = rows.stream()
                .map(RankingResult::getPublishedAt)
                .filter(java.util.Objects::nonNull)
                .findFirst()
                .orElse(null);

        return BoardRankingResponse.builder()
                .boardId(board.getId())
                .boardName(board.getName())
                .roundId(round != null ? round.getId() : null)
                .roundName(round != null ? round.getName() : null)
                .eventId(event != null ? event.getId() : null)
                .published(published)
                .calculatedAt(calculatedAt)
                .publishedAt(publishedAt)
                .teamCount(publishedOnly ? entries.size() : slotByTeam.size())
                .entries(entries)
                .build();
    }

    private int countSubmittedJudges(Long boardId, Long teamId) {
        return (int) scoreSheetRepository.findByBoardIdAndTeamId(boardId, teamId).stream()
                .filter(s -> s.getStatus() == ScoreSheetStatus.SUBMITTED)
                .count();
    }

    private BigDecimal computeJudgeTeamScore(Long sheetId, List<ScoreCriteria> criteria) {
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

    private BigDecimal average(List<BigDecimal> values) {
        BigDecimal total = values.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return total.divide(BigDecimal.valueOf(values.size()), 2, RoundingMode.HALF_UP);
    }

    private Board loadBoard(Long boardId) {
        return boardRepository.findById(boardId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Board not found"));
    }

    private record ScoredTeam(
            Long teamId, String teamName, Integer slotNumber, BigDecimal averageScore, int judgeCount) {}
}
