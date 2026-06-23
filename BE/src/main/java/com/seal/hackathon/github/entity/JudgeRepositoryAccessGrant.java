package com.seal.hackathon.github.entity;

import jakarta.persistence.Column;
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
@Table(name = "judge_repository_access_grants")
public class JudgeRepositoryAccessGrant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "team_repository_id", nullable = false)
    private Long teamRepositoryId;

    @Column(name = "judge_id", nullable = false)
    private Long judgeId;

    @Column(name = "judge_github_username", nullable = false, length = 39)
    private String judgeGithubUsername;

    @Column(name = "granted_at", nullable = false)
    private OffsetDateTime grantedAt;
}
