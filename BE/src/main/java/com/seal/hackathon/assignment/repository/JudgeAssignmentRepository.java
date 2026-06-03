package com.seal.hackathon.assignment.repository;

import com.seal.hackathon.assignment.entity.JudgeAssignment;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JudgeAssignmentRepository extends JpaRepository<JudgeAssignment, Long> {
    boolean existsByBoardIdAndJudgeId(Long boardId, Long judgeId);
    Optional<JudgeAssignment> findByBoardIdAndJudgeId(Long boardId, Long judgeId);
    List<JudgeAssignment> findByJudgeId(Long judgeId);
    List<JudgeAssignment> findByBoardId(Long boardId);
    void deleteByBoardIdAndJudgeId(Long boardId, Long judgeId);
}

