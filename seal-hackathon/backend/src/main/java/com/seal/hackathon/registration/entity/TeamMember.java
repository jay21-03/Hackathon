package com.seal.hackathon.registration.entity;

import jakarta.persistence.Entity;
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
@Table(name = "team_members")
public class TeamMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long eventId;
    private Long teamId;
    private Long userId;
    private String email;
    private String fullName;
    private String studentId;
    private String university;
    private Boolean isContactPerson;
    private String status;
    private String inviteToken;
    private OffsetDateTime invitedAt;
    private OffsetDateTime confirmedAt;
    private OffsetDateTime declinedAt;
}
