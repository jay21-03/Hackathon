package com.seal.hackathon.award.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateTeamAwardRequest {

    @NotNull
    @Positive(message = "awardCategoryId must be positive")
    private Long awardCategoryId;

    @NotNull
    @Positive(message = "teamId must be positive")
    private Long teamId;

    @Positive(message = "roundId must be positive")
    private Long roundId;

    @Size(max = 2000)
    private String note;
}
