package com.seal.hackathon.scoring.dto;

import com.seal.hackathon.common.enums.ScoreSheetStatus;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SubmittedSheetDto {
    private Long teamId;
    private Long sheetId;
    private ScoreSheetStatus status;
    private OffsetDateTime submittedAt;
    private BigDecimal judgeTeamScore;
}
