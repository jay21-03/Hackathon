package com.seal.hackathon.scoring.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class JudgeProgressDto {
    private Long judgeId;
    private String fullName;
    private int submittedCount;
    private int totalTeams;
}
