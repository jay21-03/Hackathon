package com.seal.hackathon.authprofile.dto;

import com.seal.hackathon.common.validation.AllowedEmailDomain;
import com.seal.hackathon.common.validation.ValidPassword;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank
    @Email
    @AllowedEmailDomain
    private String email;

    @NotBlank(message = "PASSWORD_REQUIRED")
    @ValidPassword
    private String password;
}
