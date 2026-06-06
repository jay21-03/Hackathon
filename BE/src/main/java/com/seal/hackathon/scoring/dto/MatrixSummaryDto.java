package com.seal.hackathon.scoring.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MatrixSummaryDto {
    private int teamCount;
    private int draftCount;
    private int submittedCount;
}
