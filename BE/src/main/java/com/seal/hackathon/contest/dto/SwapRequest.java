package com.seal.hackathon.contest.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SwapRequest {
    @NotNull(message = "slotAId must not be null")
    private Long slotAId;

    @NotNull(message = "slotBId must not be null")
    private Long slotBId;

    @AssertTrue(message = "slotAId and slotBId must differ")
    @JsonIgnore
    public boolean isDistinctSlots() {
        if (slotAId == null || slotBId == null) {
            return true;
        }
        return !slotAId.equals(slotBId);
    }
}
