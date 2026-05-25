package com.seal.hackathon.contest.entity;

import com.seal.hackathon.common.enums.BoardStatus;
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
@Table(name = "boards")
public class Board {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long roundId;
    private String name;
    private Integer boardOrder;
    private String description;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private BoardStatus status;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
