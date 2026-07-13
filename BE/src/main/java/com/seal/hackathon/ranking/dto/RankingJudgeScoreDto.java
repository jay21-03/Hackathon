package com.seal.hackathon.ranking.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RankingJudgeScoreDto {

    private Long judgeId;
    private String judgeName;
    private BigDecimal totalScore;
    private String feedback;
    private OffsetDateTime submittedAt;
}
