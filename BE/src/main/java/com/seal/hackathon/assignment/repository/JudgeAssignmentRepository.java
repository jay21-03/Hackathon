package com.seal.hackathon.assignment.repository;

import com.seal.hackathon.assignment.entity.JudgeAssignment;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface JudgeAssignmentRepository extends JpaRepository<JudgeAssignment, Long> {
    boolean existsByBoardIdAndJudgeId(Long boardId, Long judgeId);
    Optional<JudgeAssignment> findByBoardIdAndJudgeId(Long boardId, Long judgeId);
    List<JudgeAssignment> findByJudgeId(Long judgeId);
    List<JudgeAssignment> findByBoardId(Long boardId);
    void deleteByBoardIdAndJudgeId(Long boardId, Long judgeId);

    @Query("""
            SELECT COUNT(ja) > 0
            FROM JudgeAssignment ja
            JOIN Board b ON b.id = ja.boardId
            WHERE ja.judgeId = :judgeId
              AND b.roundId = :roundId
            """)
    boolean existsByJudgeIdInRound(
            @Param("judgeId") Long judgeId,
            @Param("roundId") Long roundId);
}

