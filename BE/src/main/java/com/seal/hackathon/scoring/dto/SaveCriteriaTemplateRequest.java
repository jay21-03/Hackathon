package com.seal.hackathon.scoring.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Data;

@Data
public class SaveCriteriaTemplateRequest {

    @NotBlank(message = "name must not be blank")
    @Size(max = 200, message = "name must not exceed 200 characters")
    private String name;

    @Size(max = 2000, message = "description must not exceed 2000 characters")
    private String description;

    @NotEmpty(message = "criteria must not be empty")
    @Valid
    private List<CriteriaRequestItem> criteria;
}
