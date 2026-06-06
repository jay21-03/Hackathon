package com.seal.hackathon.scoring.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SubmitMatrixResponse {
    private List<SubmittedSheetDto> submitted;
    private List<SubmitFailureDto> failed;
}
