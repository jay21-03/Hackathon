package com.seal.hackathon.contest.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.seal.hackathon.common.enums.RoundType;
import com.seal.hackathon.common.util.ContestTimelineValidation;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import lombok.Data;

@Data
public class CreateRoundRequest {

    @NotBlank(message = "name must not be blank")
    @Size(min = 1, max = 200, message = "name must be between 1 and 200 characters")
    private String name;

    @NotNull(message = "roundType must not be null")
    private RoundType roundType;

    @NotNull(message = "roundOrder must not be null")
    @Positive(message = "roundOrder must be greater than 0")
    private Integer roundOrder;

    @NotNull(message = "startAt must not be null")
    @Schema(type = "string", example = "2026-06-01T08:00:00")
    private OffsetDateTime startAt;

    @NotNull(message = "endAt must not be null")
    @Schema(type = "string", example = "2026-06-01T17:00:00")
    private OffsetDateTime endAt;

    @AssertTrue(message = "startAt must be before endAt")
    @JsonIgnore
    public boolean isRoundTimelineValid() {
        return ContestTimelineValidation.isRoundTimelineValid(startAt, endAt);
    }
}
