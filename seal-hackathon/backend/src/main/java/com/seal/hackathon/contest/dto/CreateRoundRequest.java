package com.seal.hackathon.contest.dto;

import com.seal.hackathon.common.enums.RoundType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.OffsetDateTime;
import lombok.Data;

@Data
public class CreateRoundRequest {

    @NotBlank(message = "name must not be blank")
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
}
