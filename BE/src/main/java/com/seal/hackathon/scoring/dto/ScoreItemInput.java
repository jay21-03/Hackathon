package com.seal.hackathon.scoring.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class ScoreItemInput {
    @NotNull
    private Long criteriaId;

    private BigDecimal scoreValue;
    private String comment;
}
