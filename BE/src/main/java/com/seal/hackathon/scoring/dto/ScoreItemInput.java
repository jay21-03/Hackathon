package com.seal.hackathon.scoring.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class ScoreItemInput {
    @NotNull(message = "criteriaId must not be null")
    @Positive(message = "criteriaId must be positive")
    private Long criteriaId;

    private BigDecimal scoreValue;

    @Size(max = 2000, message = "comment must not exceed 2000 characters")
    private String comment;
}
