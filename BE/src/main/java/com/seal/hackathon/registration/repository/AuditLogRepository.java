package com.seal.hackathon.registration.repository;

import com.seal.hackathon.registration.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
}
