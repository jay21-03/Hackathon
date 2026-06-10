package com.seal.hackathon.authprofile.dto;

import com.seal.hackathon.common.validation.ValidPassword;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ResetPasswordRequest {

    @NotBlank
    private String token;

    @NotBlank(message = "PASSWORD_REQUIRED")
    @ValidPassword
    private String newPassword;
}
