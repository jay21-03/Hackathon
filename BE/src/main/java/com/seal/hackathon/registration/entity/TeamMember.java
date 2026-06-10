package com.seal.hackathon.registration.entity;

import com.seal.hackathon.common.enums.TeamMemberStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
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
@Table(name = "team_members")
public class TeamMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false)
    private Long eventId;
    @Column(name = "team_id", nullable = false)
    private Long teamId;
    @Column(name = "user_id")
    private Long userId;
    @Column(nullable = false)
    private String email;
    @Column(name = "full_name", nullable = false)
    private String fullName;
    @Column(name = "student_id")
    private String studentId;
    @Column(name = "university")
    private String university;
    @Column(name = "is_contact_person", nullable = false)
    private Boolean contactPerson;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private TeamMemberStatus status;
    @Column(name = "invite_token_hash")
    private String inviteTokenHash;
    @Column(name = "invite_nonce")
    private String inviteNonce;
    @Column(name = "invite_expires_at")
    private OffsetDateTime inviteExpiresAt;
    @Column(name = "invite_consumed_at")
    private OffsetDateTime inviteConsumedAt;
    @Column(name = "invited_at")
    private OffsetDateTime invitedAt;
    @Column(name = "confirmed_at")
    private OffsetDateTime confirmedAt;
    @Column(name = "declined_at")
    private OffsetDateTime declinedAt;
    @Builder.Default
    @Column(name = "resend_count", nullable = false)
    private Integer resendCount = 0;
    @Column(name = "last_resent_at")
    private OffsetDateTime lastResentAt;
    @Column(name = "reminder_sent_at")
    private OffsetDateTime reminderSentAt;
}
