package com.seal.hackathon.authprofile.dto;

import com.seal.hackathon.common.enums.SystemRole;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssignRoleRequest {

    @NotNull(message = "role must not be null")
    private SystemRole role;
}
