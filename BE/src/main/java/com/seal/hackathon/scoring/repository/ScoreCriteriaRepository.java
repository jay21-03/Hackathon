package com.seal.hackathon.scoring.repository;

import com.seal.hackathon.scoring.entity.ScoreCriteria;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScoreCriteriaRepository extends JpaRepository<ScoreCriteria, Long> {
	List<ScoreCriteria> findByRoundId(Long roundId);
}
