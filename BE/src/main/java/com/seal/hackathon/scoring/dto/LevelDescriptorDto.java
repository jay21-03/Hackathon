package com.seal.hackathon.scoring.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LevelDescriptorDto {
    @NotBlank(message = "level must not be blank")
    @Pattern(
            regexp = "^(EXCELLENT|GOOD|SATISFACTORY|UNSATISFACTORY)$",
            message = "level must be EXCELLENT, GOOD, SATISFACTORY, or UNSATISFACTORY")
    private String level;

    @NotBlank(message = "label must not be blank")
    private String label;

    @NotNull(message = "minScore must not be null")
    private BigDecimal minScore;

    @NotNull(message = "maxScore must not be null")
    private BigDecimal maxScore;

    @AssertTrue(message = "INVALID_SCORE_RANGE")
    @JsonIgnore
    public boolean isScoreRangeValid() {
        if (minScore == null || maxScore == null) {
            return true;
        }
        return maxScore.compareTo(minScore) > 0;
    }

    @Size(max = 500, message = "description must not exceed 500 characters")
    private String description;
}
