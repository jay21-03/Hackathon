package com.seal.hackathon.contest.dto;

import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SwapResponse {
    private Long slotAId;
    private Long slotBId;
    private Long slotAPreviousTeamId;
    private Long slotBPreviousTeamId;
    private OffsetDateTime performedAt;
}
