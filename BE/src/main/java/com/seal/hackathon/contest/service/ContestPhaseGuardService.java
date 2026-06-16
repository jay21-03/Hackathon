package com.seal.hackathon.contest.service;

import com.seal.hackathon.common.enums.EventStatus;
import com.seal.hackathon.common.enums.RoundStatus;
import com.seal.hackathon.contest.entity.Event;
import com.seal.hackathon.contest.entity.Problem;
import com.seal.hackathon.contest.entity.Round;
import com.seal.hackathon.contest.repository.BoardRepository;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.contest.repository.ProblemRepository;
import com.seal.hackathon.contest.repository.RoundRepository;
import java.time.OffsetDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ContestPhaseGuardService {

    private final EventRepository eventRepository;
    private final RoundRepository roundRepository;
    private final BoardRepository boardRepository;
    private final ProblemRepository problemRepository;

    public void assertEventAllowsBoardAssignment(Event event) {
        if (event.getStatus() == EventStatus.COMPLETED || event.getStatus() == EventStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "EVENT_NOT_ASSIGNABLE");
        }
        if (event.getStatus() == EventStatus.DRAFT || event.getStatus() == EventStatus.REGISTRATION_OPEN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "EVENT_REGISTRATION_NOT_CLOSED");
        }
    }

    public void assertEventAllowsJudgeScoring(Long eventId) {
        Event event = requireEvent(eventId);
        if (event.getStatus() != EventStatus.IN_PROGRESS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "EVENT_NOT_IN_PROGRESS");
        }
    }

    public void assertRoundAllowsRankingCalculation(Long roundId) {
        Round round = roundRepository
                .findById(roundId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Round not found"));
        Event event = requireEvent(round.getEventId());
        if (event.getStatus() != EventStatus.IN_PROGRESS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "EVENT_NOT_IN_PROGRESS");
        }
        if (!isRoundReadyForRanking(round)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ROUND_NOT_READY_FOR_RANKING");
        }
    }

    public void assertEventAllowsAdvancement(Long eventId) {
        Event event = requireEvent(eventId);
        if (event.getStatus() != EventStatus.IN_PROGRESS && event.getStatus() != EventStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "EVENT_NOT_READY_FOR_ADVANCEMENT");
        }
    }

    public boolean isRoundReadyForRanking(Round round) {
        if (round.getStatus() == RoundStatus.SCORING || round.getStatus() == RoundStatus.COMPLETED) {
            return true;
        }
        OffsetDateTime now = OffsetDateTime.now();
        List<Long> boardIds = boardRepository.findByRoundId(round.getId()).stream()
                .map(board -> board.getId())
                .toList();
        if (boardIds.isEmpty()) {
            return false;
        }
        List<Problem> problems = problemRepository.findByBoardIdIn(boardIds);
        if (problems.isEmpty()) {
            return true;
        }
        return problems.stream()
                .allMatch(problem -> problem.getCloseAt() != null && !now.isBefore(problem.getCloseAt()));
    }

    private Event requireEvent(Long eventId) {
        return eventRepository
                .findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
    }
}
