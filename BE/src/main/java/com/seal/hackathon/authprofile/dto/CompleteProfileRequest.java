package com.seal.hackathon.authprofile.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CompleteProfileRequest {

    @NotBlank
    private String username;
}
