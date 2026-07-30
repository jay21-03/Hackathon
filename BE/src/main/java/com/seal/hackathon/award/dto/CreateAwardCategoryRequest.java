package com.seal.hackathon.award.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.seal.hackathon.award.enums.AwardType;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateAwardCategoryRequest {

    @NotBlank
    @Size(max = 255)
    private String name;

    @NotBlank
    @Size(max = 100)
    @Pattern(regexp = "^[A-Za-z0-9][A-Za-z0-9_\\- ]*$", message = "code format is invalid")
    private String code;

    @Size(max = 2000)
    private String description;

    @NotNull
    private AwardType awardType;

    @Positive(message = "rankOrder must be positive")
    private Integer rankOrder;

    @Min(1)
    private int maxWinners = 1;

    @Size(max = 255)
    private String prizeValue;

    @PositiveOrZero(message = "sortOrder must be zero or positive")
    private Integer sortOrder;

    @Positive(message = "roundId must be positive")
    private Long roundId;

    private Boolean isActive = true;

    @AssertTrue(message = "RANK_AWARD_REQUIRES_RANK_ORDER")
    @JsonIgnore
    public boolean isRankOrderRequiredForRankAward() {
        return awardType != AwardType.RANK || rankOrder != null;
    }

    @AssertTrue(message = "CUSTOM_AWARD_MUST_NOT_HAVE_RANK_ORDER")
    @JsonIgnore
    public boolean isRankOrderAbsentForCustomAward() {
        return awardType != AwardType.CUSTOM || rankOrder == null;
    }
}
