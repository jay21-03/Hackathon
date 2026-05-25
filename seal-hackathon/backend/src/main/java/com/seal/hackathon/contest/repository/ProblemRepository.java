package com.seal.hackathon.contest.repository;

import com.seal.hackathon.contest.entity.Problem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProblemRepository extends JpaRepository<Problem, Long> {
	List<Problem> findByBoardId(Long boardId);
}
