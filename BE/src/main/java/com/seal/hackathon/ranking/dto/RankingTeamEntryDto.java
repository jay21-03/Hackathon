package com.seal.hackathon.ranking.dto;

import java.math.BigDecimal;
import java.util.List;
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
    private List<RankingJudgeScoreDto> judgeScores;
    private List<RankingCriterionScoreDto> criteriaScores;
}
