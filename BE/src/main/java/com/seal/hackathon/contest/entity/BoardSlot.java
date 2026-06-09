package com.seal.hackathon.contest.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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
@Table(name = "board_slots")
public class BoardSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long roundId;
    private Long boardId;
    private Integer teamNumber;
    private Long teamId;
    private OffsetDateTime assignedAt;
    private Long assignedBy;
    private OffsetDateTime createdAt;

    @Version
    @Column(nullable = false)
    private Integer version;
}
