package com.seal.hackathon.assignment.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.seal.hackathon.common.enums.SystemRole;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BulkStaffInvitationItem {

    @NotBlank
    @Email
    private String email;

    private SystemRole role;

    @AssertTrue(message = "Role must be MENTOR or JUDGE")
    @JsonIgnore
    public boolean isRoleValid() {
        if (role == null) {
            return true;
        }
        return role == SystemRole.MENTOR || role == SystemRole.JUDGE;
    }
}
