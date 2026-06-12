package com.seal.hackathon.award.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateTeamAwardRequest {

    @NotNull
    private Long awardCategoryId;

    @NotNull
    private Long teamId;

    private Long roundId;

    @Size(max = 2000)
    private String note;
}
