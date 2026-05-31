package com.seal.hackathon.scoring.repository;

import com.seal.hackathon.scoring.entity.ScoreSheet;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScoreSheetRepository extends JpaRepository<ScoreSheet, Long> {
	List<ScoreSheet> findByBoardIdAndTeamId(Long boardId, Long teamId);

	List<ScoreSheet> findByJudgeId(Long judgeId);
}
