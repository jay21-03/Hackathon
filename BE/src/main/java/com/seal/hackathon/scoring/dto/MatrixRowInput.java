package com.seal.hackathon.scoring.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
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

    @AssertTrue(message = "DUPLICATE_CRITERIA_SCORE")
    @JsonIgnore
    public boolean hasUniqueCriteriaScores() {
        if (scores == null) {
            return true;
        }
        Set<Long> seen = new HashSet<>();
        for (ScoreItemInput score : scores) {
            if (score == null || score.getCriteriaId() == null) {
                continue;
            }
            if (!seen.add(score.getCriteriaId())) {
                return false;
            }
        }
        return true;
    }
}
