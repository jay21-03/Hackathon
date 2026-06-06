package com.seal.hackathon.aireview.entity;

import com.seal.hackathon.common.enums.SubmissionStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "team_repositories")
public class TeamRepository {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long teamId;
    private String repositoryUrl;
    private String repositoryName;
    private OffsetDateTime lastReviewedAt;
    private OffsetDateTime nextReviewAt;
    private Integer reviewIntervalMinutes;
    private Long createdBy;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubmissionStatus status;

    private OffsetDateTime submittedAt;
}
