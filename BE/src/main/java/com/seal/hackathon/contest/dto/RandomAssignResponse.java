package com.seal.hackathon.contest.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RandomAssignResponse {
    private int assignedCount;
    private List<SlotAssignmentDetail> details;
    private List<Long> unassignedTeamIds;
}
