package com.seal.hackathon.aireview.entity;

import com.seal.hackathon.common.enums.SubmissionStatus;
import com.seal.hackathon.common.enums.RepositoryAccessStatus;
import com.seal.hackathon.common.enums.RepositoryProvisionStatus;
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
    private Long roundId;
    private Long boardId;
    private Long problemId;
    private String repositoryUrl;
    private String repositoryName;
    private String githubOwner;
    private String githubRepoName;
    private Long githubRepoId;
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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RepositoryAccessStatus accessStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RepositoryProvisionStatus provisionStatus;

    private OffsetDateTime openedAt;
    private OffsetDateTime closedAt;
    private OffsetDateTime provisionedAt;
    private String lastError;
}
