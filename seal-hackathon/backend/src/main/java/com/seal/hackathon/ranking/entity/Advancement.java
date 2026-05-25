package com.seal.hackathon.ranking.entity;

import jakarta.persistence.Entity;
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

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "advancements")
public class Advancement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long fromRoundId;
    private Long fromBoardId;
    private Long toRoundId;
    private Long toBoardId;
    private Long teamId;
    private Integer basisRank;
    private BigDecimal basisScore;
    private Long createdBy;
    private OffsetDateTime createdAt;
}
