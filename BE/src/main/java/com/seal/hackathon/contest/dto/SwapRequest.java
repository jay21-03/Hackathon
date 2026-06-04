package com.seal.hackathon.contest.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SwapRequest {
    @NotNull(message = "slotAId must not be null")
    private Long slotAId;

    @NotNull(message = "slotBId must not be null")
    private Long slotBId;
}
