package com.seal.hackathon.registration.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BulkTeamInvitationResponse {

    private int total;
    private int succeededCount;
    private int failedCount;
    private TeamDetailDto team;
    private List<BulkTeamInvitationFailure> failed;
}
