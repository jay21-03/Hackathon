package com.seal.hackathon.scoring.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.Data;

@Data
public class MatrixRowInput {
    @NotNull
    private Long teamId;

    private String generalFeedback;

    private List<ScoreItemInput> scores;
}
