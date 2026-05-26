package com.seal.hackathon.contest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class CreateBoardRequest {

    @NotBlank(message = "name must not be blank")
    private String name;

    @NotNull(message = "boardOrder must not be null")
    @Positive(message = "boardOrder must be greater than 0")
    private Integer boardOrder;

    private String description;
}
