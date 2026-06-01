package com.seal.hackathon.contest.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SlotAssignmentDetail {
    private Long slotId;
    private Long boardId;
    private Long teamId;
}
