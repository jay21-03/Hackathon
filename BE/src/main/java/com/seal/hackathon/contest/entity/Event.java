package com.seal.hackathon.contest.entity;

import com.seal.hackathon.common.enums.EventStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.Table;
import java.time.LocalDate;
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
@Table(name = "events")
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;
    private String rules;
    private LocalDate startDate;
    private LocalDate endDate;
    private OffsetDateTime registrationStartAt;
    private OffsetDateTime registrationEndAt;
    private Integer maxTeams;
    private Integer minTeamSize;
    private Integer maxTeamSize;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private EventStatus status;
    @Column(name = "academic_term_id", nullable = false)
    private Long academicTermId;
    private Long createdBy;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
