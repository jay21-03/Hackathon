package com.seal.hackathon.contest.dto;

import com.seal.hackathon.common.enums.RoundType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Positive;
import java.time.OffsetDateTime;
import lombok.Data;

@Data
public class UpdateRoundRequest {
    private String name;
    private RoundType roundType;

    @Positive(message = "roundOrder must be greater than 0")
    private Integer roundOrder;

    @Schema(type = "string", example = "2026-06-01T08:00:00")
    private OffsetDateTime startAt;

    @Schema(type = "string", example = "2026-06-01T17:00:00")
    private OffsetDateTime endAt;
}
