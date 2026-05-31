package com.seal.hackathon.authprofile.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @NotBlank(message = "fullName must not be blank")
    private String fullName;

    private String studentId;
    private String university;
    private String avatarUrl;
}
