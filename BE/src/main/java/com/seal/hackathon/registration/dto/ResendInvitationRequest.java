package com.seal.hackathon.registration.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class ResendInvitationRequest {

    @NotNull(message = "teamMemberId is required")
    @Positive(message = "teamMemberId must be positive")
    private Long teamMemberId;
}
