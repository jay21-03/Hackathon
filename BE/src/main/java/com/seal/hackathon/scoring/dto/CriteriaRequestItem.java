package com.seal.hackathon.scoring.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;
import lombok.Data;

@Data
public class CriteriaRequestItem {
    @NotBlank
    @Size(max = 50, message = "code must not exceed 50 characters")
    private String code;

    @NotBlank
    @Size(max = 200, message = "name must not exceed 200 characters")
    private String name;

    @NotNull
    @DecimalMin(value = "0", inclusive = false, message = "weight must be greater than 0")
    @DecimalMax(value = "100", message = "weight must be at most 100")
    private BigDecimal weight;

    @NotNull
    private BigDecimal minScore;

    @NotNull
    private BigDecimal maxScore;

    @AssertTrue(message = "INVALID_SCORE_RANGE")
    @JsonIgnore
    public boolean isScoreRangeValid() {
        if (minScore == null || maxScore == null) {
            return true;
        }
        return maxScore.compareTo(minScore) > 0;
    }

    @Size(max = 2000, message = "description must not exceed 2000 characters")
    private String description;

    @NotNull
    @Size(min = 4, max = 4)
    @Valid
    private List<LevelDescriptorDto> levelDescriptors;

    private Integer sortOrder;
}
