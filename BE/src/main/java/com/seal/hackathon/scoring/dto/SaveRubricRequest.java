package com.seal.hackathon.scoring.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import lombok.Data;

@Data
public class SaveRubricRequest {
    @NotEmpty
    @Valid
    private List<CriteriaRequestItem> criteria;

    private boolean replaceExisting = true;
}
