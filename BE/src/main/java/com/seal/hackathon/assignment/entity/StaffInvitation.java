package com.seal.hackathon.assignment.entity;

import com.seal.hackathon.common.enums.StaffInvitationStatus;
import com.seal.hackathon.common.enums.SystemRole;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "staff_invitations")
public class StaffInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long boardId;

    private Long eventId;

    private String email;

    @Enumerated(EnumType.STRING)
    private SystemRole role;

    @Enumerated(EnumType.STRING)
    private StaffInvitationStatus status;

    private String inviteTokenHash;
    private String inviteNonce;
    private OffsetDateTime inviteExpiresAt;
    private OffsetDateTime invitedAt;
    private OffsetDateTime acceptedAt;
    private OffsetDateTime declinedAt;
    private Long acceptedUserId;
    private Long createdBy;
    private OffsetDateTime createdAt;
    private Integer resendCount;
    private OffsetDateTime lastResentAt;
    private OffsetDateTime reminderSentAt;
}
