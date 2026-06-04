package com.seal.hackathon.contest.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssignRequest {
    @NotNull(message = "teamId must not be null")
    private Long teamId;
    private Boolean forceReplace = false;
}
