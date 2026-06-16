package com.seal.hackathon.registration.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class TeamRegistrationSummaryDto {
    long confirmedCount;
    long pendingCount;
    long awaitingApprovalCount;
    long waitlistCount;
}
