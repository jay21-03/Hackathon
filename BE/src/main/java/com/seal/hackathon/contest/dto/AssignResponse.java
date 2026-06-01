package com.seal.hackathon.contest.dto;

import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AssignResponse {
    private Long slotId;
    private Long boardId;
    private Long teamId;
    private Long previousTeamId;
    private OffsetDateTime assignedAt;
}
