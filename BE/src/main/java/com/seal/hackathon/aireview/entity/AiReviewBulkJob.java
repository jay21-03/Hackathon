package com.seal.hackathon.aireview.entity;

import com.seal.hackathon.common.enums.AiReviewBulkJobStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
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
@Table(name = "ai_review_bulk_jobs")
public class AiReviewBulkJob {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AiReviewBulkJobStatus status;

    @Column(nullable = false)
    private int total;

    @Column(nullable = false)
    private int processed;

    @Column(name = "succeeded_count", nullable = false)
    private int succeededCount;

    @Column(name = "failed_count", nullable = false)
    private int failedCount;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "result_json", columnDefinition = "jsonb")
    private String resultJson;

    @Column(name = "error_message")
    private String errorMessage;

    @Column(name = "started_by")
    private Long startedBy;

    @Column(name = "started_at", nullable = false)
    private OffsetDateTime startedAt;

    @Column(name = "finished_at")
    private OffsetDateTime finishedAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
