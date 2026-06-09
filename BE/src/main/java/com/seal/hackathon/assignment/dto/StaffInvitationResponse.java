package com.seal.hackathon.assignment.dto;

import com.seal.hackathon.common.enums.StaffInvitationStatus;
import com.seal.hackathon.common.enums.SystemRole;
import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StaffInvitationResponse {

    private Long id;
    private Long boardId;
    private String boardName;
    private Long eventId;
    private String eventName;
    private String email;
    private SystemRole role;
    private StaffInvitationStatus status;
    private OffsetDateTime invitedAt;
    private OffsetDateTime inviteExpiresAt;
    private OffsetDateTime acceptedAt;
    private OffsetDateTime declinedAt;
    private Integer resendCount;
    private OffsetDateTime lastResentAt;
    private Integer emailOpenCount;
    private OffsetDateTime emailOpenedAt;
    private OffsetDateTime emailAcceptClickedAt;
    private OffsetDateTime emailDeclineClickedAt;
}
