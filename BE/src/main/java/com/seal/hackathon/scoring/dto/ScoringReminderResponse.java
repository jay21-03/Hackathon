package com.seal.hackathon.scoring.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ScoringReminderResponse {
    private int notifiedJudgeCount;
    private List<String> notifiedJudgeNames;
    private boolean organizerNotified;
}
