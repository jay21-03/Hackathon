package com.seal.hackathon.assignment.repository;

import com.seal.hackathon.assignment.entity.MentorAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MentorAssignmentRepository extends JpaRepository<MentorAssignment, Long> {
}
