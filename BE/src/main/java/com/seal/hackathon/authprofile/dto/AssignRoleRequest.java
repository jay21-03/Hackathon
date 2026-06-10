package com.seal.hackathon.authprofile.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.seal.hackathon.common.enums.SystemRole;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssignRoleRequest {

    @NotNull(message = "role must not be null")
    private SystemRole role;

    @AssertTrue(message = "Role must be ORGANIZER, MENTOR, or JUDGE")
    @JsonIgnore
    public boolean isAssignableRole() {
        return role == SystemRole.ORGANIZER || role == SystemRole.MENTOR || role == SystemRole.JUDGE;
    }
}
