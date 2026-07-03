package com.seal.hackathon.scoring.repository;

import com.seal.hackathon.common.enums.ScoreSheetStatus;
import com.seal.hackathon.scoring.entity.ScoreSheet;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ScoreSheetRepository extends JpaRepository<ScoreSheet, Long> {
	List<ScoreSheet> findByBoardIdAndTeamId(Long boardId, Long teamId);

	List<ScoreSheet> findByJudgeId(Long judgeId);

	List<ScoreSheet> findByBoardId(Long boardId);

	List<ScoreSheet> findByBoardIdAndJudgeId(Long boardId, Long judgeId);

	Optional<ScoreSheet> findByBoardIdAndTeamIdAndJudgeId(Long boardId, Long teamId, Long judgeId);

	boolean existsByBoardIdAndStatus(Long boardId, ScoreSheetStatus status);

	void deleteByBoardIdAndTeamId(Long boardId, Long teamId);
}
