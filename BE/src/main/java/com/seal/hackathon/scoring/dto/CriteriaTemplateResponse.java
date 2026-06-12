package com.seal.hackathon.scoring.dto;

import java.time.OffsetDateTime;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CriteriaTemplateResponse {
    private Long id;
    private String name;
    private String description;
    private Boolean systemDefault;
    private List<CriteriaRequestItem> criteria;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
