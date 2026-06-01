package com.seal.hackathon.contest.dto;

import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MoveResponse {
    private Long fromSlotId;
    private Long toSlotId;
    private Long fromPreviousTeamId;
    private Long toPreviousTeamId;
    private OffsetDateTime performedAt;
}
