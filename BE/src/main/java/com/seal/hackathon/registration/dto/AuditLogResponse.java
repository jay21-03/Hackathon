package com.seal.hackathon.registration.dto;

import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuditLogResponse {
    private Long id;
    private Long actorId;
    private String actorEmail;
    private String action;
    private String entityType;
    private Long entityId;
    private String beforeState;
    private String afterState;
    private OffsetDateTime createdAt;
}
