package com.seal.hackathon.scoring.dto;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class JudgeSheetStatusDto {
    private Long judgeId;
    private String status;
    private Long sheetId;
    private BigDecimal judgeTeamScore;
}
