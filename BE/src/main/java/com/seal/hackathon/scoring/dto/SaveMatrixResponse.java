package com.seal.hackathon.scoring.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SaveMatrixResponse {
    private List<Long> savedTeamIds;
    private List<Long> skippedSubmittedTeamIds;
    private List<MatrixTeamRowResponse> rows;
}
