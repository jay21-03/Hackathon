package com.seal.hackathon.mail.entity;

import com.seal.hackathon.mail.enums.InvitationEmailType;
import jakarta.persistence.Column;
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
@Table(name = "invitation_email_deliveries")
public class InvitationEmailDelivery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private InvitationEmailType invitationType;

    private Long staffInvitationId;
    private Long teamMemberId;
    private String trackingToken;
    private String acceptUrl;
    private String declineUrl;
    private OffsetDateTime sentAt;
    private OffsetDateTime openedAt;
    private Integer openCount;
    private OffsetDateTime acceptClickedAt;
    private OffsetDateTime declineClickedAt;
    @Column(name = "is_reminder")
    private Boolean reminder;
}
