package com.seal.hackathon.registration.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ResendInvitationRequest {

    @NotNull(message = "teamMemberId is required")
    private Long teamMemberId;
}