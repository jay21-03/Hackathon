package com.seal.hackathon.contest.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MoveRequest {
    @NotNull(message = "fromSlotId must not be null")
    private Long fromSlotId;

    @NotNull(message = "toSlotId must not be null")
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
