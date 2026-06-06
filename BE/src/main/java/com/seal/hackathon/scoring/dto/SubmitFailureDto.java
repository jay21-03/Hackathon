package com.seal.hackathon.scoring.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SubmitFailureDto {
    private Long teamId;
    private String errorCode;
    private List<Long> missingCriteriaIds;
}
