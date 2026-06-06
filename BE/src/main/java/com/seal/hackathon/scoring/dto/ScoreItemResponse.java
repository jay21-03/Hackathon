package com.seal.hackathon.scoring.dto;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ScoreItemResponse {
    private Long criteriaId;
    private String criteriaCode;
    private BigDecimal scoreValue;
    private String comment;
}
