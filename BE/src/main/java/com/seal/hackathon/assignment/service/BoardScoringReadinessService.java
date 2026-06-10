package com.seal.hackathon.assignment.service;

import com.seal.hackathon.assignment.entity.JudgeAssignment;
import com.seal.hackathon.assignment.repository.JudgeAssignmentRepository;
import com.seal.hackathon.common.enums.JudgeBoardReadiness;
import com.seal.hackathon.contest.entity.Board;
import com.seal.hackathon.contest.entity.Event;
import com.seal.hackathon.contest.entity.Round;
import com.seal.hackathon.contest.repository.BoardRepository;
import com.seal.hackathon.contest.repository.EventRepository;
import com.seal.hackathon.contest.repository.RoundRepository;
import com.seal.hackathon.notification.service.NotificationService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class BoardScoringReadinessService {

    private final JudgeAssignmentRepository judgeAssignmentRepository;
    private final BoardRepository boardRepository;
    private final RoundRepository roundRepository;
    private final EventRepository eventRepository;
    private final JudgeBoardReadinessService judgeBoardReadinessService;
    private final NotificationService notificationService;

    @Transactional
    public void notifyReadyJudgesForBoard(Long boardId) {
        Board board = boardRepository.findById(boardId).orElse(null);
        if (board == null || !judgeBoardReadinessService.isBoardReadyToScore(boardId)) {
            return;
        }
        Round round = board.getRoundId() == null ? null : roundRepository.findById(board.getRoundId()).orElse(null);
        Event event = round == null || round.getEventId() == null
                ? null
                : eventRepository.findById(round.getEventId()).orElse(null);
        List<JudgeAssignment> judges = judgeAssignmentRepository.findByBoardId(boardId);
        for (JudgeAssignment assignment : judges) {
            notificationService.notifyJudgeBoardReadyToScore(
                    assignment.getJudgeId(),
                    board,
                    round,
                    event);
        }
    }

    @Transactional
    public void notifyReadyJudgesForRound(Long roundId) {
        for (Board board : boardRepository.findByRoundId(roundId)) {
            notifyReadyJudgesForBoard(board.getId());
        }
    }

    @Scheduled(fixedDelayString = "${app.scoring.readiness-poll-ms:180000}")
    @Transactional
    public void pollBoardsReadyToScore() {
        int notified = 0;
        for (JudgeAssignment assignment : judgeAssignmentRepository.findAll()) {
            if (!judgeBoardReadinessService.isBoardReadyToScore(assignment.getBoardId())) {
                continue;
            }
            Board board = boardRepository.findById(assignment.getBoardId()).orElse(null);
            if (board == null) {
                continue;
            }
            Round round = board.getRoundId() == null ? null : roundRepository.findById(board.getRoundId()).orElse(null);
            Event event = round == null || round.getEventId() == null
                    ? null
                    : eventRepository.findById(round.getEventId()).orElse(null);
            if (notificationService.notifyJudgeBoardReadyToScore(
                    assignment.getJudgeId(), board, round, event)) {
                notified++;
            }
        }
        if (notified > 0) {
            log.info("Board scoring readiness poll: notifiedJudges={}", notified);
        }
    }
}
