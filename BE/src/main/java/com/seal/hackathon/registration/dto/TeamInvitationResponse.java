package com.seal.hackathon.registration.dto;

import com.seal.hackathon.common.enums.TeamMemberStatus;
import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TeamInvitationResponse {

    private Long id;
    private Long teamId;
    private String teamName;
    private Long eventId;
    private String email;
    private String fullName;
    private TeamMemberStatus status;
    private OffsetDateTime invitedAt;
    private OffsetDateTime inviteExpiresAt;
    private OffsetDateTime confirmedAt;
    private OffsetDateTime declinedAt;
    private Integer resendCount;
    private OffsetDateTime lastResentAt;
    private boolean expired;
    private Integer emailOpenCount;
    private OffsetDateTime emailOpenedAt;
    private OffsetDateTime emailAcceptClickedAt;
    private OffsetDateTime emailDeclineClickedAt;
}
