package com.seal.hackathon.scoring.dto;

import com.seal.hackathon.common.enums.ScoreSheetStatus;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MatrixTeamRowResponse {
    private Long teamId;
    private String teamName;
    private String repositoryUrl;
    private Integer slotNumber;
    private Long sheetId;
    private ScoreSheetStatus status;
    private String generalFeedback;
    private boolean editable;
    private List<ScoreItemResponse> scores;
    private ComputedScoreDto computed;
}
