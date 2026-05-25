package com.seal.hackathon.assignment.repository;

import com.seal.hackathon.assignment.entity.JudgeAssignment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JudgeAssignmentRepository extends JpaRepository<JudgeAssignment, Long> {
	List<JudgeAssignment> findByBoardId(Long boardId);
}
