package com.seal.hackathon.registration.repository;

import com.seal.hackathon.registration.entity.AuditLog;
import java.util.Collection;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByEntityTypeAndEntityIdInOrderByCreatedAtDesc(
            String entityType, Collection<Long> entityIds, Pageable pageable);
}
