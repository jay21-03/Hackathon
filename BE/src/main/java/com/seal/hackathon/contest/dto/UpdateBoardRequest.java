package com.seal.hackathon.contest.dto;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateBoardRequest {
    @Size(min = 1, max = 200, message = "name must be between 1 and 200 characters")
    private String name;

    @Positive(message = "boardOrder must be greater than 0")
    private Integer boardOrder;

    @Size(max = 500, message = "description must not exceed 500 characters")
    private String description;
}
