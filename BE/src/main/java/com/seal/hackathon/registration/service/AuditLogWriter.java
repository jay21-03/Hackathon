package com.seal.hackathon.registration.service;

import com.seal.hackathon.registration.entity.AuditLog;
import com.seal.hackathon.registration.repository.AuditLogRepository;
import java.time.OffsetDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditLogWriter {

    private final AuditLogRepository auditLogRepository;

    public void write(
            Long actorId,
            String actorEmail,
            String action,
            String entityType,
            Long entityId,
            String beforeState,
            String afterState) {
        auditLogRepository.save(AuditLog.builder()
                .actorId(actorId)
                .actorEmail(actorEmail)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .beforeState(beforeState)
                .afterState(afterState)
                .createdAt(OffsetDateTime.now())
                .build());
    }
}
