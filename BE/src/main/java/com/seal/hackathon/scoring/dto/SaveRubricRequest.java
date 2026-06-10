package com.seal.hackathon.scoring.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.seal.hackathon.common.util.RubricValidation;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import lombok.Data;

@Data
public class SaveRubricRequest {
    @NotEmpty
    @Valid
    private List<CriteriaRequestItem> criteria;

    private boolean replaceExisting = true;

    @AssertTrue(message = "INVALID_WEIGHT_SUM")
    @JsonIgnore
    public boolean isWeightSumValid() {
        return RubricValidation.isWeightSumValid(criteria);
    }

    @AssertTrue(message = "DUPLICATE_CRITERIA")
    @JsonIgnore
    public boolean hasUniqueCriteria() {
        return RubricValidation.hasUniqueCodesAndNames(criteria);
    }
}
