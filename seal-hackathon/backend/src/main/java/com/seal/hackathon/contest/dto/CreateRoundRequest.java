package com.seal.hackathon.contest.dto;

import com.seal.hackathon.common.enums.RoundType;
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
    private OffsetDateTime startAt;

    @NotNull(message = "endAt must not be null")
    private OffsetDateTime endAt;
}
