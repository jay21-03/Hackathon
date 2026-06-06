package com.seal.hackathon.scoring.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;
import lombok.Data;

@Data
public class CriteriaRequestItem {
    @NotBlank
    private String code;

    @NotBlank
    private String name;

    @NotNull
    private BigDecimal weight;

    @NotNull
    private BigDecimal minScore;

    @NotNull
    private BigDecimal maxScore;

    private String description;

    @NotNull
    @Size(min = 4, max = 4)
    @Valid
    private List<LevelDescriptorDto> levelDescriptors;

    private Integer sortOrder;
}
