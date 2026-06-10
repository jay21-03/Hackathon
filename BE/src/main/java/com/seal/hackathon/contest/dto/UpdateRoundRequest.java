package com.seal.hackathon.contest.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.seal.hackathon.common.enums.RoundType;
import com.seal.hackathon.common.util.ContestTimelineValidation;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import lombok.Data;

@Data
public class UpdateRoundRequest {
    @Size(min = 1, max = 200, message = "name must be between 1 and 200 characters")
    private String name;

    private RoundType roundType;

    @Positive(message = "roundOrder must be greater than 0")
    private Integer roundOrder;

    @Schema(type = "string", example = "2026-06-01T08:00:00")
    private OffsetDateTime startAt;

    @Schema(type = "string", example = "2026-06-01T17:00:00")
    private OffsetDateTime endAt;

    @AssertTrue(message = "startAt must be before endAt")
    @JsonIgnore
    public boolean isRoundTimelineValid() {
        return ContestTimelineValidation.isRoundTimelineValid(startAt, endAt);
    }
}
