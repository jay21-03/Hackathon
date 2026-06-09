package com.seal.hackathon.scoring.entity;

import com.seal.hackathon.common.enums.ScoreSheetStatus;
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
@Table(name = "score_sheets")
public class ScoreSheet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long judgeAssignmentId;
    private Long boardId;
    private Long teamId;
    private Long judgeId;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ScoreSheetStatus status;
    private String generalFeedback;
    private OffsetDateTime submittedAt;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    @Version
    @Column(nullable = false)
    private Integer version;
}
