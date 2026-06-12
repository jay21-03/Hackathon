package com.seal.hackathon.authprofile.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateUserApprovalRequest {

    @NotNull(message = "action must not be null")
    private ApprovalAction action;

    @Size(max = 500, message = "reason must not exceed 500 characters")
    private String reason;

    public enum ApprovalAction {
        APPROVE,
        REJECT
    }
}
