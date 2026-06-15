package com.seal.hackathon.aireview.entity;

import com.seal.hackathon.common.enums.AiReviewKind;
import com.seal.hackathon.common.enums.AiReviewStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ai_reviews")
public class AiReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "team_id", nullable = false)
    private Long teamId;

    @Column(name = "round_id")
    private Long roundId;

    @Column(name = "repo_commit_id")
    private Long repoCommitId;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "review_kind", nullable = false)
    private AiReviewKind reviewKind = AiReviewKind.PER_PUSH;

    @Column(name = "commit_sha")
    private String commitSha;

    @Column(name = "github_issue_url")
    private String githubIssueUrl;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AiReviewStatus status = AiReviewStatus.PENDING;

    @Column(name = "review_score", precision = 8, scale = 3)
    private BigDecimal reviewScore;

    private String summary;

    @Column(columnDefinition = "text")
    private String issues;

    @Column(columnDefinition = "text")
    private String suggestions;

    @Column(name = "ai_model")
    private String aiModel;

    @Column(name = "rag_level")
    private String ragLevel;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "structured_output", columnDefinition = "jsonb")
    private String structuredOutput;

    @Column(name = "reviewed_at")
    private OffsetDateTime reviewedAt;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
}
