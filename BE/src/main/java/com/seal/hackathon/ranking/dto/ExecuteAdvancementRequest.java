package com.seal.hackathon.ranking.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.util.List;
import lombok.Data;

@Data
public class ExecuteAdvancementRequest {
    @NotNull(message = "fromRoundId must not be null")
    @Positive(message = "fromRoundId must be positive")
    private Long fromRoundId;

    @NotNull(message = "toRoundId must not be null")
    @Positive(message = "toRoundId must be positive")
    private Long toRoundId;

    @Min(1)
    private int topNPerBoard = 2;

    /** Optional — first board in target round when omitted. */
    @Positive(message = "targetBoardId must be positive")
    private Long targetBoardId;

    /** When non-empty, advances exactly these teams (in order) instead of top-N. */
    private List<@Positive(message = "teamId must be positive") Long> teamIds;

    @AssertTrue(message = "fromRoundId and toRoundId must differ")
    @JsonIgnore
    public boolean isDistinctRounds() {
        if (fromRoundId == null || toRoundId == null) {
            return true;
        }
        return !fromRoundId.equals(toRoundId);
    }
}
