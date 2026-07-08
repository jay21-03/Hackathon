package com.seal.hackathon.scoring.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TeamProgressDto {
    private Long teamId;
    private String teamName;
    private List<JudgeSheetStatusDto> judges;
    private int submittedJudgeCount;
    private int requiredJudgeCount;
    private String scoringStatus;
    private String ineligibleReason;
}
