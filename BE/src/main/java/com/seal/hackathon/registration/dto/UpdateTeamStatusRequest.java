package com.seal.hackathon.registration.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.seal.hackathon.common.enums.TeamStatus;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.springframework.util.StringUtils;

@Data
public class UpdateTeamStatusRequest {

    @NotNull(message = "status is required")
    private TeamStatus status;

    @Size(max = 1000, message = "reason must not exceed 1000 characters")
    private String reason;

    @AssertTrue(message = "reason is required for REJECTED or DISQUALIFIED status")
    @JsonIgnore
    public boolean isReasonValid() {
        if (status != TeamStatus.REJECTED && status != TeamStatus.DISQUALIFIED) {
            return true;
        }
        return StringUtils.hasText(reason);
    }
}