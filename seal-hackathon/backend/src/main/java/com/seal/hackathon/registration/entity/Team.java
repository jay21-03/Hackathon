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

    private Long eventId;
    private String name;
    private Integer sequenceNo;
    private Long contactUserId;
    private String contactEmail;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private TeamStatus status;
    private OffsetDateTime confirmedAt;
    private String rejectedReason;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
