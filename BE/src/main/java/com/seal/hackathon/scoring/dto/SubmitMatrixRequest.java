package com.seal.hackathon.scoring.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Positive;
import java.util.List;
import lombok.Data;

@Data
public class SubmitMatrixRequest {
    private boolean submitAll;

    private List<@Positive(message = "teamId must be positive") Long> teamIds;

    @AssertTrue(message = "teamIds required when submitAll is false")
    @JsonIgnore
    public boolean isTeamIdsValid() {
        if (submitAll) {
            return true;
        }
        return teamIds != null && !teamIds.isEmpty();
    }
}
