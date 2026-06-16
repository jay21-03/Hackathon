package com.seal.hackathon.assignment.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StaffCarryoverResponse {

    private int total;
    private int succeededCount;
    private int failedCount;
    private List<StaffCarryoverSuccess> succeeded;
    private List<StaffCarryoverFailure> failed;
}
