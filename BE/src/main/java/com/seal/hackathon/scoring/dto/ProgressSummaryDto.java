package com.seal.hackathon.scoring.dto;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProgressSummaryDto {
    private int teamCount;
    private int judgeCount;
    private int expectedSheets;
    private int submittedSheets;
    private int draftSheets;
    private int missingSheets;
    private BigDecimal completionPercent;
}
