package com.seal.hackathon.contest.repository;

import com.seal.hackathon.contest.entity.Problem;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProblemRepository extends JpaRepository<Problem, Long> {
	List<Problem> findByBoardId(Long boardId);

	List<Problem> findByBoardIdIn(List<Long> boardIds);

	List<Problem> findByCloseAtLessThanEqual(OffsetDateTime closeAt);
}
