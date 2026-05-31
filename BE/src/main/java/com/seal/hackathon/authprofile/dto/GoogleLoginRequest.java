package com.seal.hackathon.authprofile.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoogleLoginRequest {

    @NotBlank(message = "idToken must not be blank")
    private String idToken;
}
