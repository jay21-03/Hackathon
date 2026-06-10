package com.seal.hackathon.scoring.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Data;

@Data
public class MatrixRowInput {
    @NotNull(message = "teamId must not be null")
    @Positive(message = "teamId must be positive")
    private Long teamId;

    @Size(max = 2000, message = "generalFeedback must not exceed 2000 characters")
    private String generalFeedback;

    @Valid
    private List<ScoreItemInput> scores;
}
