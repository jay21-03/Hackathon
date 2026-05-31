package com.seal.hackathon.contest.entity;

import com.seal.hackathon.common.enums.RoundStatus;
import com.seal.hackathon.common.enums.RoundType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
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
@Table(name = "rounds")
public class Round {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long eventId;
    private String name;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private RoundType roundType;
    private Integer roundOrder;
    private OffsetDateTime startAt;
    private OffsetDateTime endAt;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private RoundStatus status;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
