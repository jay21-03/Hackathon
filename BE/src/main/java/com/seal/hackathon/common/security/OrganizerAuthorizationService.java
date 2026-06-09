package com.seal.hackathon.common.security;

import com.seal.hackathon.authprofile.security.CurrentUserPrincipal;
import com.seal.hackathon.authprofile.security.CurrentUserProvider;
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
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class OrganizerAuthorizationService {

    private final EventRepository eventRepository;
    private final RoundRepository roundRepository;
    private final BoardRepository boardRepository;
    private final BoardSlotRepository boardSlotRepository;
    private final ProblemRepository problemRepository;
    private final CurrentUserProvider currentUserProvider;

    public CurrentUserPrincipal requireOrganizer() {
        CurrentUserPrincipal principal = currentUserProvider.getCurrentUser();
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
        }
        if (principal.getRoles() == null || !principal.getRoles().contains("ORGANIZER")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ONLY_ORGANIZER");
        }
        return principal;
    }

    public Event requireEventOwnedByCurrentOrganizer(Long eventId) {
        requireOrganizer();
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND"));
        assertEventOwnedByCurrentOrganizer(event);
        return event;
    }

    public Round requireRoundOwnedByCurrentOrganizer(Long roundId) {
        Round round = roundRepository.findById(roundId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ROUND_NOT_FOUND"));
        requireEventOwnedByCurrentOrganizer(round.getEventId());
        return round;
    }

    public Board requireBoardOwnedByCurrentOrganizer(Long boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "BOARD_NOT_FOUND"));
        Round round = roundRepository.findById(board.getRoundId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ROUND_NOT_FOUND"));
        requireEventOwnedByCurrentOrganizer(round.getEventId());
        return board;
    }

    public BoardSlot requireSlotOwnedByCurrentOrganizer(Long slotId) {
        BoardSlot slot = boardSlotRepository.findById(slotId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "BOARD_SLOT_NOT_FOUND"));
        requireBoardOwnedByCurrentOrganizer(slot.getBoardId());
        return slot;
    }

    public Problem requireProblemOwnedByCurrentOrganizer(Long problemId) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "PROBLEM_NOT_FOUND"));
        requireBoardOwnedByCurrentOrganizer(problem.getBoardId());
        return problem;
    }

    public void assertEventOwnedByCurrentOrganizer(Event event) {
        CurrentUserPrincipal principal = requireOrganizer();
        if (event.getCreatedBy() == null || !event.getCreatedBy().equals(principal.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "EVENT_ACCESS_DENIED");
        }
    }
}
