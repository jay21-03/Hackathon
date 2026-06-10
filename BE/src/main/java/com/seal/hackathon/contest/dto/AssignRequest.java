package com.seal.hackathon.contest.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class AssignRequest {
    @NotNull(message = "teamId must not be null")
    @Positive(message = "teamId must be greater than 0")
    private Long teamId;
    private Boolean forceReplace = false;
}
