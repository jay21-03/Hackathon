package com.seal.hackathon.registration.entity;

import com.seal.hackathon.common.enums.TeamStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "teams")
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Column(nullable = false)
    private String name;

    @Column(name = "sequence_no")
    private Integer sequenceNo;

    @Column(name = "contact_user_id")
    private Long contactUserId;

    @Column(name = "contact_email", nullable = false)
    private String contactEmail;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private TeamStatus status;
    @Column(name = "confirmed_at")
    private OffsetDateTime confirmedAt;
    @Column(name = "rejected_reason")
    private String rejectedReason;
    @Column(name = "created_at")
    private OffsetDateTime createdAt;
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @Version
    @Column(nullable = false)
    private Integer version;
}
