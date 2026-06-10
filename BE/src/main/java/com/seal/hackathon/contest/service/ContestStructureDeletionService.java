package com.seal.hackathon.contest.service;

import com.seal.hackathon.aireview.repository.TeamRepositoryEntityRepository;
import com.seal.hackathon.assignment.repository.JudgeAssignmentRepository;
import com.seal.hackathon.assignment.repository.MentorAssignmentRepository;
import com.seal.hackathon.assignment.repository.StaffInvitationRepository;
import com.seal.hackathon.common.security.OrganizerAuthorizationService;
import com.seal.hackathon.common.storage.FileStorageService;
import com.seal.hackathon.contest.entity.Board;
import com.seal.hackathon.contest.entity.Problem;
import com.seal.hackathon.contest.entity.Round;
import com.seal.hackathon.contest.repository.BoardRepository;
import com.seal.hackathon.contest.repository.BoardSlotRepository;
import com.seal.hackathon.contest.repository.ProblemRepository;
import com.seal.hackathon.contest.repository.RoundRepository;
import com.seal.hackathon.ranking.repository.RankingResultRepository;
import com.seal.hackathon.scoring.entity.ScoreSheet;
import com.seal.hackathon.scoring.repository.ScoreCriteriaRepository;
import com.seal.hackathon.scoring.repository.ScoreItemRepository;
import com.seal.hackathon.scoring.repository.ScoreSheetRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ContestStructureDeletionService {

    private final OrganizerAuthorizationService organizerAuthorizationService;
    private final BoardRepository boardRepository;
    private final BoardSlotRepository boardSlotRepository;
    private final ProblemRepository problemRepository;
    private final RoundRepository roundRepository;
    private final RankingResultRepository rankingResultRepository;
    private final ScoreSheetRepository scoreSheetRepository;
    private final ScoreItemRepository scoreItemRepository;
    private final JudgeAssignmentRepository judgeAssignmentRepository;
    private final MentorAssignmentRepository mentorAssignmentRepository;
    private final StaffInvitationRepository staffInvitationRepository;
    private final TeamRepositoryEntityRepository teamRepositoryEntityRepository;
    private final ScoreCriteriaRepository scoreCriteriaRepository;
    private final FileStorageService fileStorageService;

    @Transactional
    public void deleteBoard(Long boardId) {
        Board board = organizerAuthorizationService.requireBoardOwnedByCurrentOrganizer(boardId);
        if (boardSlotRepository.existsByBoardIdAndTeamIdIsNotNull(boardId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "BOARD_HAS_TEAMS — gỡ hết đội khỏi bảng trước khi xóa");
        }
        if (rankingResultRepository.existsByBoardIdAndPublishedAtIsNotNull(boardId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "BOARD_HAS_PUBLISHED_RANKING — không xóa bảng đã công bố kết quả");
        }

        deleteBoardCascade(board);
    }

    @Transactional
    public void deleteRound(Long roundId) {
        Round round = organizerAuthorizationService.requireRoundOwnedByCurrentOrganizer(roundId);
        if (boardSlotRepository.existsByRoundIdAndTeamIdIsNotNull(roundId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "ROUND_HAS_TEAMS — gỡ hết đội khỏi vòng trước khi xóa");
        }
        if (!rankingResultRepository.findByRoundIdAndPublishedAtIsNotNullOrderByBoardIdAscRankAsc(roundId).isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "ROUND_HAS_PUBLISHED_RANKING — không xóa vòng đã công bố kết quả");
        }

        List<Board> boards = boardRepository.findByRoundId(roundId);
        for (Board board : boards) {
            deleteBoardCascade(board);
        }
        scoreCriteriaRepository.deleteByRoundId(roundId);
        roundRepository.delete(round);
    }

    private void deleteBoardCascade(Board board) {
        Long boardId = board.getId();

        for (Problem problem : problemRepository.findByBoardId(boardId)) {
            teamRepositoryEntityRepository.deleteAll(
                    teamRepositoryEntityRepository.findByProblemIdOrderByTeamIdAsc(problem.getId()));
            fileStorageService.deleteByPublicUrl(problem.getAttachmentUrl());
            problemRepository.delete(problem);
        }

        rankingResultRepository.deleteByBoardId(boardId);

        List<ScoreSheet> scoreSheets = scoreSheetRepository.findByBoardId(boardId);
        for (ScoreSheet scoreSheet : scoreSheets) {
            scoreItemRepository.deleteByScoreSheetId(scoreSheet.getId());
        }
        if (!scoreSheets.isEmpty()) {
            scoreSheetRepository.deleteAll(scoreSheets);
        }

        judgeAssignmentRepository.deleteAll(judgeAssignmentRepository.findByBoardId(boardId));
        mentorAssignmentRepository.deleteAll(mentorAssignmentRepository.findByBoardId(boardId));
        staffInvitationRepository.deleteAll(staffInvitationRepository.findByBoardId(boardId));

        boardSlotRepository.deleteAll(boardSlotRepository.findByBoardId(boardId));
        boardRepository.delete(board);
    }
}
