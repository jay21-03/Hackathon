package com.seal.hackathon.contest.dto;

import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class UpdateBoardRequest {
    private String name;

    @Positive(message = "boardOrder must be greater than 0")
    private Integer boardOrder;

    private String description;
}
