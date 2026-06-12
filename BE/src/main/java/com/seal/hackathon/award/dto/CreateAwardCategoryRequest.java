package com.seal.hackathon.award.dto;

import com.seal.hackathon.award.enums.AwardType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateAwardCategoryRequest {

    @NotBlank
    @Size(max = 255)
    private String name;

    @NotBlank
    @Size(max = 100)
    private String code;

    @Size(max = 2000)
    private String description;

    @NotNull
    private AwardType awardType;

    private Integer rankOrder;

    @Min(1)
    private int maxWinners = 1;

    @Size(max = 255)
    private String prizeValue;

    private Integer sortOrder;

    private Long roundId;

    private Boolean isActive = true;
}
