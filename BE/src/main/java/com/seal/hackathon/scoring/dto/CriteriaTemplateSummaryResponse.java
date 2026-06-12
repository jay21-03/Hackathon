package com.seal.hackathon.scoring.dto;

import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CriteriaTemplateSummaryResponse {
    private Long id;
    private String name;
    private String description;
    private Boolean systemDefault;
    private int criteriaCount;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
