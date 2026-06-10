package com.seal.hackathon.authprofile.dto;

import com.seal.hackathon.common.validation.ValidPassword;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SetPasswordRequest {

    private String currentPassword;

    @NotBlank(message = "PASSWORD_REQUIRED")
    @ValidPassword
    private String newPassword;
}
