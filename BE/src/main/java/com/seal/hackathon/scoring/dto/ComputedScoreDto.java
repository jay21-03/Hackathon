package com.seal.hackathon.scoring.dto;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ComputedScoreDto {
    private BigDecimal judgeTeamScore;
    private String formula;
}
