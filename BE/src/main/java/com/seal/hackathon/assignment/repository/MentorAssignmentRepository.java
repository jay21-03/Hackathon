package com.seal.hackathon.assignment.repository;

import com.seal.hackathon.assignment.entity.MentorAssignment;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MentorAssignmentRepository extends JpaRepository<MentorAssignment, Long> {
    boolean existsByBoardIdAndMentorId(Long boardId, Long mentorId);
    Optional<MentorAssignment> findByBoardIdAndMentorId(Long boardId, Long mentorId);
    List<MentorAssignment> findByMentorId(Long mentorId);
    List<MentorAssignment> findByBoardId(Long boardId);
    void deleteByBoardIdAndMentorId(Long boardId, Long mentorId);

    @Query("""
            SELECT COUNT(ma) > 0
            FROM MentorAssignment ma
            JOIN Board b ON b.id = ma.boardId
            WHERE ma.mentorId = :mentorId
              AND b.roundId = :roundId
              AND ma.boardId <> :boardId
            """)
    boolean existsByMentorIdInRoundExcludingBoard(
            @Param("mentorId") Long mentorId,
            @Param("roundId") Long roundId,
            @Param("boardId") Long boardId);

    @Query("""
            SELECT COUNT(ma) > 0
            FROM MentorAssignment ma
            JOIN Board b ON b.id = ma.boardId
            WHERE ma.mentorId = :mentorId
              AND b.roundId = :roundId
            """)
    boolean existsByMentorIdInRound(
            @Param("mentorId") Long mentorId,
            @Param("roundId") Long roundId);
}

