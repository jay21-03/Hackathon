package com.seal.hackathon.assignment.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class ResendStaffInvitationRequest {

    @NotNull
    @Positive(message = "staffInvitationId must be positive")
    private Long staffInvitationId;
}
