package com.seal.hackathon.award.entity;

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
@Table(name = "team_awards")
public class TeamAward {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long eventId;
    private Long roundId;
    private Long awardCategoryId;
    private Long teamId;
    private Long awardedBy;
    private OffsetDateTime awardedAt;
    private String note;
    private Boolean published;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
