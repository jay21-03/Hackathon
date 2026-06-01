package com.seal.hackathon.registration.dto;

import com.seal.hackathon.common.enums.TeamStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateTeamStatusRequest {

    @NotNull(message = "status is required")
    private TeamStatus status;

    private String reason;
}