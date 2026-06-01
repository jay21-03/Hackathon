package com.seal.hackathon.registration.dto;

import java.time.OffsetDateTime;

public class TeamMemberDto {
    private Long id;
    private String email;
    private String fullName;
    private String status;
    private boolean contactPerson;
    private OffsetDateTime invitedAt;
    private OffsetDateTime confirmedAt;

    public TeamMemberDto() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isContactPerson() {
        return contactPerson;
    }

    public void setContactPerson(boolean contactPerson) {
        this.contactPerson = contactPerson;
    }

    public OffsetDateTime getInvitedAt() {
        return invitedAt;
    }

    public void setInvitedAt(OffsetDateTime invitedAt) {
        this.invitedAt = invitedAt;
    }

    public OffsetDateTime getConfirmedAt() {
        return confirmedAt;
    }

    public void setConfirmedAt(OffsetDateTime confirmedAt) {
        this.confirmedAt = confirmedAt;
    }
}
