package com.seal.hackathon.contest.dto;

import lombok.Data;

@Data
public class MoveRequest {
    private Long fromSlotId;
    private Long toSlotId;
}
