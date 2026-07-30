package com.seal.hackathon.contest.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class MoveRequest {
    @NotNull(message = "fromSlotId must not be null")
    @Positive(message = "fromSlotId must be positive")
    private Long fromSlotId;

    @NotNull(message = "toSlotId must not be null")
    @Positive(message = "toSlotId must be positive")
    private Long toSlotId;

    @AssertTrue(message = "fromSlotId and toSlotId must differ")
    @JsonIgnore
    public boolean isDistinctSlots() {
        if (fromSlotId == null || toSlotId == null) {
            return true;
        }
        return !fromSlotId.equals(toSlotId);
    }
}
