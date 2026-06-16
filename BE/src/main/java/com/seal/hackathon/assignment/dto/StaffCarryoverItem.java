package com.seal.hackathon.assignment.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.seal.hackathon.common.enums.SystemRole;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StaffCarryoverItem {

    @NotNull
    private Long userId;

    private SystemRole role;

    @AssertTrue(message = "Role must be MENTOR or JUDGE when provided")
    @JsonIgnore
    public boolean isRoleValid() {
        return role == null || role == SystemRole.MENTOR || role == SystemRole.JUDGE;
    }
}
