package com.seal.hackathon.authprofile.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SetPasswordRequest {

    private String currentPassword;

    @NotBlank
    private String newPassword;
}
