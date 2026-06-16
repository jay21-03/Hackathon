package com.seal.hackathon.award.dto;

import com.seal.hackathon.award.enums.AwardType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateAwardCategoryRequest {

    @Size(max = 255)
    private String name;

    @Size(max = 100)
    @Pattern(regexp = "^[A-Za-z0-9][A-Za-z0-9_\\- ]*$", message = "code format is invalid")
    private String code;

    @Size(max = 2000)
    private String description;

    private AwardType awardType;

    private Integer rankOrder;

    @Min(1)
    private Integer maxWinners;

    @Size(max = 255)
    private String prizeValue;

    private Integer sortOrder;

    private Long roundId;

    private Boolean isActive;
}
