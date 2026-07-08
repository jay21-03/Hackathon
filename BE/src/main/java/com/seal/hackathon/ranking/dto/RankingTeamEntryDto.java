package com.seal.hackathon.ranking.dto;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RankingTeamEntryDto {

    private Integer rank;
    private Long teamId;
    private String teamName;
    private Integer slotNumber;
    private BigDecimal averageScore;
    private Integer submittedJudgeCount;
    private String rankingStatus;
    private String ineligibleReason;
}
