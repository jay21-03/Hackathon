package com.seal.hackathon.assignment.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.seal.hackathon.common.enums.SystemRole;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Data;

@Data
public class BulkCreateStaffInvitationRequest {

    @NotNull
    private SystemRole defaultRole;

    @NotEmpty
    @Size(max = 100, message = "items must not exceed 100 entries")
    @Valid
    private List<BulkStaffInvitationItem> items;

    @AssertTrue(message = "Role must be MENTOR or JUDGE")
    @JsonIgnore
    public boolean isDefaultRoleValid() {
        return defaultRole == SystemRole.MENTOR || defaultRole == SystemRole.JUDGE;
    }
}
