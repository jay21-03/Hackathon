package com.seal.hackathon.contest.service;

import com.seal.hackathon.common.enums.EventStatus;
import com.seal.hackathon.common.enums.RoundStatus;
import com.seal.hackathon.common.enums.TeamStatus;
import com.seal.hackathon.contest.entity.Board;
import com.seal.hackathon.contest.entity.Event;
import com.seal.hackathon.contest.entity.Problem;
import com.seal.hackathon.contest.entity.Round;
import com.seal.hackathon.contest.repository.BoardRepository;
import com.seal.hackathon.contest.repository.BoardSlotRepository;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.contest.repository.ProblemRepository;
import com.seal.hackathon.contest.repository.RoundRepository;
import com.seal.hackathon.ranking.repository.RankingResultRepository;
import com.seal.hackathon.registration.repository.TeamRepository;
import java.time.OffsetDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoundLifecycleService {

    private final EventRepository eventRepository;
    private final RoundRepository roundRepository;
    private final BoardRepository boardRepository;
    private final BoardSlotRepository boardSlotRepository;
    private final ProblemRepository problemRepository;
    private final RankingResultRepository rankingResultRepository;
    private final TeamRepository teamRepository;

    @Transactional
    public int syncRoundStatuses() {
        OffsetDateTime now = OffsetDateTime.now();
        int transitions = 0;
        for (Event event : eventRepository.findByStatusIn(
                List.of(EventStatus.REGISTRATION_CLOSED, EventStatus.IN_PROGRESS))) {
            transitions += syncRoundsForEvent(event, now);
        }
        return transitions;
    }

    private int syncRoundsForEvent(Event event, OffsetDateTime now) {
        int transitions = 0;
        for (Round round : roundRepository.findByEventId(event.getId())) {
            RoundStatus before = round.getStatus();
            RoundStatus next = resolveRoundStatus(round, event, now);
            if (next != null && next != before) {
                round.setStatus(next);
                round.setUpdatedAt(now);
                roundRepository.save(round);
                transitions++;
                log.info(
                        "Round lifecycle transition: roundId={}, eventId={}, {} -> {}",
                        round.getId(),
                        event.getId(),
                        before,
                        next);
            }
        }
        return transitions;
    }

    private RoundStatus resolveRoundStatus(Round round, Event event, OffsetDateTime now) {
        if (round.getStatus() == RoundStatus.COMPLETED) {
            return null;
        }

        List<Board> boards = boardRepository.findByRoundId(round.getId());
        List<Long> boardIds = boards.stream()
                .map(Board::getId)
                .toList();
        List<Problem> problems = boardIds.isEmpty() ? List.of() : problemRepository.findByBoardIdIn(boardIds);
        List<Long> boardsWithConfirmedTeams = boards.stream()
                .filter(board -> hasConfirmedTeam(board.getId()))
                .map(Board::getId)
                .toList();

        boolean allRankingsPublished = !boardsWithConfirmedTeams.isEmpty()
                && boardsWithConfirmedTeams.stream()
                        .allMatch(boardId -> rankingResultRepository.existsByBoardIdAndPublishedAtIsNotNull(boardId));
        if (allRankingsPublished) {
            return RoundStatus.COMPLETED;
        }

        boolean allProblemsClosed = !problems.isEmpty()
                && problems.stream()
                        .allMatch(problem -> problem.getCloseAt() != null && now.isAfter(problem.getCloseAt()));
        if (allProblemsClosed) {
            return RoundStatus.SCORING;
        }

        boolean anyProblemReleased = problems.stream()
                .anyMatch(problem -> problem.getReleaseAt() != null && !now.isBefore(problem.getReleaseAt()));
        if (anyProblemReleased) {
            return RoundStatus.PROBLEM_RELEASED;
        }

        if (event.getStatus() == EventStatus.IN_PROGRESS
                && (round.getStatus() == RoundStatus.DRAFT || round.getStatus() == null)) {
            return RoundStatus.UPCOMING;
        }

        return null;
    }

    private boolean hasConfirmedTeam(Long boardId) {
        return boardSlotRepository.findByBoardId(boardId).stream()
                .map(slot -> slot.getTeamId())
                .filter(teamId -> teamId != null)
                .anyMatch(teamId -> teamRepository.findById(teamId)
                        .map(team -> team.getStatus() == TeamStatus.CONFIRMED)
                        .orElse(false));
    }
}
