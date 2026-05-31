package com.seal.hackathon.ranking.repository;

import com.seal.hackathon.ranking.entity.RankingResult;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RankingResultRepository extends JpaRepository<RankingResult, Long> {
	List<RankingResult> findByBoardId(Long boardId);
}
