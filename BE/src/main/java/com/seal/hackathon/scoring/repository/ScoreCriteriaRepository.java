package com.seal.hackathon.scoring.repository;

import com.seal.hackathon.scoring.entity.ScoreCriteria;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScoreCriteriaRepository extends JpaRepository<ScoreCriteria, Long> {
	List<ScoreCriteria> findByRoundIdOrderBySortOrderAsc(Long roundId);

	void deleteByRoundId(Long roundId);

	boolean existsByRoundIdAndCode(Long roundId, String code);

	boolean existsByRoundIdAndName(Long roundId, String name);
}
