package com.seal.hackathon.registration.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BulkTeamInvitationFailure {

    private String email;
    private String reason;
}
