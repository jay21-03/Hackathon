package com.seal.hackathon.contest.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MoveRequest {
    @NotNull(message = "fromSlotId must not be null")
    private Long fromSlotId;

    @NotNull(message = "toSlotId must not be null")
    private Long toSlotId;
}
