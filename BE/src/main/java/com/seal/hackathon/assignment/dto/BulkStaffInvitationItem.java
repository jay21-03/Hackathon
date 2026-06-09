package com.seal.hackathon.assignment.dto;

import com.seal.hackathon.common.enums.SystemRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BulkStaffInvitationItem {

    @NotBlank
    @Email
    private String email;

    private SystemRole role;
}
