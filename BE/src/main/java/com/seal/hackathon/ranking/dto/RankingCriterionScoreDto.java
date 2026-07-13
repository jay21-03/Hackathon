package com.seal.hackathon.ranking.dto;

import java.math.BigDecimal;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RankingCriterionScoreDto {

    private Long criteriaId;
    private String criteriaName;
    private BigDecimal weight;
    private BigDecimal averageScore;
    private BigDecimal weightedScore;
    private List<String> comments;
}
