package com.seal.hackathon.github.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SaveRepoTemplateRequest {

    @NotBlank(message = "templateOwner must not be blank")
    private String templateOwner;

    @NotBlank(message = "templateRepo must not be blank")
    private String templateRepo;

    private String defaultBranch;
    private Boolean enabled;
}
