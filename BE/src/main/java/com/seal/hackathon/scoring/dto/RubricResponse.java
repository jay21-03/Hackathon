package com.seal.hackathon.scoring.dto;

import java.math.BigDecimal;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RubricResponse {
    private Long roundId;
    private List<CriteriaResponse> criteria;
    private BigDecimal totalWeight;
    private boolean locked;
}
