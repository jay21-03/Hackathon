package com.seal.hackathon.scoring.entity;

import com.seal.hackathon.scoring.dto.LevelDescriptorDto;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
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
@Table(name = "score_criteria")
public class ScoreCriteria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long roundId;

    @Column(nullable = false, length = 50)
    private String code;

    private String name;
    private String description;
    private BigDecimal weight;
    private BigDecimal minScore;
    private BigDecimal maxScore;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @Column(name = "level_descriptors", columnDefinition = "jsonb", nullable = false)
    @JdbcTypeCode(SqlTypes.JSON)
    private List<LevelDescriptorDto> levelDescriptors;

    private OffsetDateTime createdAt;
}
