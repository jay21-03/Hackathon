package com.seal.hackathon.contest.entity;

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
@Table(name = "board_slot_assignments_audit")
public class BoardSlotAssignmentAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "round_id", nullable = false)
    private Long roundId;

    @Column(name = "board_id", nullable = false)
    private Long boardId;

    @Column(name = "slot_id", nullable = false)
    private Long slotId;

    @Column(name = "team_id_before")
    private Long teamIdBefore;

    @Column(name = "team_id_after")
    private Long teamIdAfter;

    private String action;

    @Column(name = "performed_by")
    private Long performedBy;

    @Column(name = "performed_at")
    private OffsetDateTime performedAt;

    private String reason;
}
