package com.seal.hackathon.assignment.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.seal.hackathon.common.enums.SystemRole;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateStaffInvitationRequest {

    @NotBlank
    @Email
    private String email;

    @NotNull
    private SystemRole role;

    @AssertTrue(message = "Role must be MENTOR or JUDGE")
    @JsonIgnore
    public boolean isRoleValid() {
        return role == SystemRole.MENTOR || role == SystemRole.JUDGE;
    }
}
