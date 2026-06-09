package com.seal.hackathon.ranking.service;

import com.seal.hackathon.assignment.repository.JudgeAssignmentRepository;
import com.seal.hackathon.common.enums.ScoreSheetStatus;
import com.seal.hackathon.common.security.OrganizerAuthorizationService;
import com.seal.hackathon.contest.entity.Board;
import com.seal.hackathon.contest.entity.BoardSlot;
import com.seal.hackathon.contest.entity.Round;
import com.seal.hackathon.contest.repository.BoardRepository;
import com.seal.hackathon.contest.repository.BoardSlotRepository;
import com.seal.hackathon.contest.repository.RoundRepository;
import com.seal.hackathon.ranking.dto.BoardPublishReadinessDto;
import com.seal.hackathon.ranking.dto.PublishReadinessResponse;
import com.seal.hackathon.ranking.repository.RankingResultRepository;
import com.seal.hackathon.scoring.entity.ScoreCriteria;
import com.seal.hackathon.scoring.entity.ScoreSheet;
import com.seal.hackathon.scoring.repository.ScoreCriteriaRepository;
import com.seal.hackathon.scoring.repository.ScoreSheetRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class PublishReadinessService {

    private static final BigDecimal WEIGHT_TARGET = new BigDecimal("100");

    private final OrganizerAuthorizationService organizerAuthorizationService;
    private final RoundRepository roundRepository;
    private final BoardRepository boardRepository;
    private final BoardSlotRepository boardSlotRepository;
    private final JudgeAssignmentRepository judgeAssignmentRepository;
    private final ScoreCriteriaRepository scoreCriteriaRepository;
    private final ScoreSheetRepository scoreSheetRepository;
    private final RankingResultRepository rankingResultRepository;

    @Transactional(readOnly = true)
    public PublishReadinessResponse evaluateEvent(Long eventId) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        List<BoardPublishReadinessDto> boards = new ArrayList<>();
        List<String> eventBlockers = new ArrayList<>();

        for (Round round : roundRepository.findByEventId(eventId)) {
            List<ScoreCriteria> criteria = scoreCriteriaRepository.findByRoundIdOrderBySortOrderAsc(round.getId());
            if (criteria.isEmpty()) {
                eventBlockers.add("Vòng «" + round.getName() + "» chưa có tiêu chí chấm.");
            } else {
                BigDecimal weightSum = criteria.stream()
                        .map(ScoreCriteria::getWeight)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                if (weightSum.compareTo(WEIGHT_TARGET) != 0) {
                    eventBlockers.add("Vòng «" + round.getName() + "» tổng trọng số rubric phải bằng 100%.");
                }
            }

            for (Board board : boardRepository.findByRoundId(round.getId())) {
                if (!rankingResultRepository.existsByBoardId(board.getId())) {
                    continue;
                }
                boards.add(evaluateBoard(board, round, criteria));
            }
        }

        if (boards.isEmpty()) {
            eventBlockers.add("Chưa có bảng nào được tính xếp hạng.");
        }

        boolean ready = eventBlockers.isEmpty() && boards.stream().allMatch(BoardPublishReadinessDto::isReady);
        return PublishReadinessResponse.builder()
                .eventId(eventId)
                .ready(ready)
                .blockers(eventBlockers)
                .boards(boards)
                .build();
    }

    @Transactional(readOnly = true)
    public void requireBoardReadyToPublish(Long boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "BOARD_NOT_FOUND"));
        Round round = roundRepository.findById(board.getRoundId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ROUND_NOT_FOUND"));
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(round.getEventId());

        List<ScoreCriteria> criteria = scoreCriteriaRepository.findByRoundIdOrderBySortOrderAsc(round.getId());
        BoardPublishReadinessDto readiness = evaluateBoard(board, round, criteria);
        if (!readiness.isReady()) {
            String message = readiness.getBlockers().isEmpty()
                    ? "PUBLISH_NOT_READY"
                    : readiness.getBlockers().get(0);
            throw new ResponseStatusException(HttpStatus.CONFLICT, message);
        }
    }

    private BoardPublishReadinessDto evaluateBoard(Board board, Round round, List<ScoreCriteria> criteria) {
        List<String> blockers = new ArrayList<>();
        List<BoardSlot> slots = boardSlotRepository.findByBoardIdOrderByTeamNumberAsc(board.getId());
        int teamCount = (int) slots.stream().filter(s -> s.getTeamId() != null).count();
        int judgeCount = judgeAssignmentRepository.findByBoardId(board.getId()).size();

        if (criteria.isEmpty()) {
            blockers.add("Chưa có rubric cho vòng «" + round.getName() + "».");
        }
        if (judgeCount == 0) {
            blockers.add("Chưa phân công giám khảo.");
        }
        if (teamCount == 0) {
            blockers.add("Chưa gán đội vào slot.");
        }

        int expected = teamCount * judgeCount;
        List<ScoreSheet> sheets = scoreSheetRepository.findByBoardId(board.getId());
        int submitted = (int) sheets.stream().filter(s -> s.getStatus() == ScoreSheetStatus.SUBMITTED).count();
        if (expected > 0 && submitted < expected) {
            blockers.add("Chấm điểm chưa hoàn tất (" + submitted + "/" + expected + " phiếu).");
        }

        return BoardPublishReadinessDto.builder()
                .boardId(board.getId())
                .boardName(board.getName())
                .ready(blockers.isEmpty())
                .blockers(blockers)
                .build();
    }
}
