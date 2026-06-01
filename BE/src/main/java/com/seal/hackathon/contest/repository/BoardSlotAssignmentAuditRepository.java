package com.seal.hackathon.contest.repository;

import com.seal.hackathon.contest.entity.BoardSlotAssignmentAudit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardSlotAssignmentAuditRepository extends JpaRepository<BoardSlotAssignmentAudit, Long> {
}
