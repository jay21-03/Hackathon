package com.seal.hackathon.award.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class SuggestAwardsFromRankingRequest {

    /** Optional - limit suggestions to a single round's published rankings. */
    @Positive(message = "roundId must be positive")
    private Long roundId;

    /** Optional - limit suggestions to a single board's published rankings. */
    @Positive(message = "boardId must be positive")
    private Long boardId;

    @AssertTrue(message = "AWARD_SUGGEST_SCOPE_CONFLICT")
    @JsonIgnore
    public boolean hasAtMostOneScope() {
        return roundId == null || boardId == null;
    }
}
