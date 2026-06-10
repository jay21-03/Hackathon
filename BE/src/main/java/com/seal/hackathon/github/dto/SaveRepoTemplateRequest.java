package com.seal.hackathon.github.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SaveRepoTemplateRequest {

    @NotBlank(message = "templateOwner must not be blank")
    @Size(max = 39, message = "templateOwner must not exceed 39 characters")
    @Pattern(
            regexp = "^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$",
            message = "templateOwner is invalid")
    private String templateOwner;

    @NotBlank(message = "templateRepo must not be blank")
    @Size(max = 100, message = "templateRepo must not exceed 100 characters")
    @Pattern(
            regexp = "^[a-zA-Z0-9](?:[a-zA-Z0-9._-]*[a-zA-Z0-9])?$",
            message = "templateRepo is invalid")
    private String templateRepo;

    @Size(max = 100, message = "defaultBranch must not exceed 100 characters")
    private String defaultBranch;
    private Boolean enabled;
}
