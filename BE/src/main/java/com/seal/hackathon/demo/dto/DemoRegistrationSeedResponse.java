package com.seal.hackathon.demo.dto;

import java.util.ArrayList;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DemoRegistrationSeedResponse {
    private Long eventId;
    private Integer existingRealTeamCount;
    private Integer regularTeamsCreated;
    private Integer singleMemberTeamsCreated;
    private Integer teamsSkipped;
    private Integer usersCreated;
    private Integer usersReused;
    private Integer membersCreated;
    private Integer totalTeamsAfterSeed;
    private Integer eventQuota;
    private Integer expectedConfirmedAfterApproval;
    private Integer expectedWaitlistAfterApproval;
    @Builder.Default
    private List<String> warnings = new ArrayList<>();
}
