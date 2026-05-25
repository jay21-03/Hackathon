package com.seal.hackathon.registration.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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
    private String status;
    private OffsetDateTime confirmedAt;
    private String rejectedReason;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
