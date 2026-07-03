package com.seal.hackathon.scoring.service;

import com.seal.hackathon.aireview.entity.TeamRepository;
import com.seal.hackathon.aireview.repository.TeamRepositoryEntityRepository;
import com.seal.hackathon.common.enums.RepositoryProvisionStatus;
import com.seal.hackathon.contest.entity.Board;
import com.seal.hackathon.contest.entity.BoardSlot;
import com.seal.hackathon.contest.repository.BoardRepository;
import com.seal.hackathon.contest.repository.BoardSlotRepository;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ScoringRepositoryGuardService {

    private final BoardSlotRepository boardSlotRepository;
    private final BoardRepository boardRepository;
    private final TeamRepositoryEntityRepository teamRepositoryEntityRepository;

    @Transactional(readOnly = true)
    public void requireBoardRepositoriesReady(Long boardId) {
        List<Long> missingTeamIds = boardSlotRepository.findByBoardIdOrderByTeamNumberAsc(boardId).stream()
                .map(BoardSlot::getTeamId)
                .filter(Objects::nonNull)
                .filter(teamId -> !hasScorableRepositoryForBoard(boardId, teamId))
                .toList();
        if (!missingTeamIds.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "BOARD_REPOSITORIES_NOT_READY:" + missingTeamIds);
        }
    }

    @Transactional(readOnly = true)
    public void requireTeamRepositoryReady(Long boardId, Long teamId) {
        if (!hasScorableRepositoryForBoard(boardId, teamId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "TEAM_REPOSITORY_NOT_READY:" + teamId);
        }
    }

    @Transactional(readOnly = true)
    public boolean hasScorableRepositoryForBoard(Long boardId, Long teamId) {
        Board board = boardRepository.findById(boardId).orElse(null);
        Long roundId = board != null ? board.getRoundId() : null;
        return teamRepositoryEntityRepository.findAllByTeamId(teamId).stream()
                .filter(repository -> belongsToBoardScope(repository, boardId, roundId))
                .anyMatch(this::isScorableRepository);
    }

    private boolean belongsToBoardScope(TeamRepository repository, Long boardId, Long roundId) {
        if (Objects.equals(repository.getBoardId(), boardId)) {
            return true;
        }
        if (repository.getBoardId() != null) {
            return false;
        }
        if (roundId != null && Objects.equals(repository.getRoundId(), roundId)) {
            return true;
        }
        return false;
    }

    public boolean isScorableRepository(TeamRepository repository) {
        if (repository == null || !StringUtils.hasText(repository.getRepositoryUrl())) {
            return false;
        }
        return repository.getProvisionStatus() == RepositoryProvisionStatus.CREATED;
    }
}
