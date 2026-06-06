package com.seal.hackathon.scoring.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ScoreMatrixResponse {
    private BoardBriefDto board;
    private JudgeBriefDto judge;
    private List<CriteriaResponse> criteria;
    private List<MatrixTeamRowResponse> teams;
    private MatrixSummaryDto summary;
}
