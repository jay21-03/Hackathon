package com.seal.hackathon.assignment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ResendStaffInvitationRequest {

    @NotNull
    private Long staffInvitationId;
}
