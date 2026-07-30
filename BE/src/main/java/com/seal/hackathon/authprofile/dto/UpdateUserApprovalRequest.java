package com.seal.hackathon.authprofile.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.springframework.util.StringUtils;

@Data
public class UpdateUserApprovalRequest {

    @NotNull(message = "action must not be null")
    private ApprovalAction action;

    @Size(max = 500, message = "reason must not exceed 500 characters")
    private String reason;

    @AssertTrue(message = "reason is required when rejecting a user")
    @JsonIgnore
    public boolean isRejectReasonValid() {
        return action != ApprovalAction.REJECT || StringUtils.hasText(reason);
    }

    @AssertTrue(message = "reason is only supported when rejecting a user")
    @JsonIgnore
    public boolean isApproveReasonValid() {
        return action != ApprovalAction.APPROVE || !StringUtils.hasText(reason);
    }

    public enum ApprovalAction {
        APPROVE,
        REJECT
    }
}
