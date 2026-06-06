package com.seal.hackathon.assignment.dto;

import com.seal.hackathon.common.enums.SystemRole;
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
}
