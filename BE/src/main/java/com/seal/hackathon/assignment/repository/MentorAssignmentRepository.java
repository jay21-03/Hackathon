package com.seal.hackathon.assignment.repository;

import com.seal.hackathon.assignment.entity.MentorAssignment;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MentorAssignmentRepository extends JpaRepository<MentorAssignment, Long> {
    boolean existsByBoardIdAndMentorId(Long boardId, Long mentorId);
    Optional<MentorAssignment> findByBoardIdAndMentorId(Long boardId, Long mentorId);
    List<MentorAssignment> findByMentorId(Long mentorId);
    List<MentorAssignment> findByBoardId(Long boardId);
    void deleteByBoardIdAndMentorId(Long boardId, Long mentorId);
}

