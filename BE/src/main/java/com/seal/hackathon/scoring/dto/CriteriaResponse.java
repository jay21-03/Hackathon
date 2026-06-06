package com.seal.hackathon.scoring.dto;

import java.math.BigDecimal;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CriteriaResponse {
    private Long id;
    private String code;
    private String name;
    private BigDecimal weight;
    private BigDecimal minScore;
    private BigDecimal maxScore;
    private String description;
    private Integer sortOrder;
    private List<LevelDescriptorDto> levelDescriptors;
}
