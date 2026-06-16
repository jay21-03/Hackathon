package com.seal.hackathon.registration.dto;

import java.time.OffsetDateTime;
import java.util.List;

public class TeamDetailDto {
    private Long id;
    private Long eventId;
    private String name;
    private String status;
    private List<TeamMemberDto> members;
    private OffsetDateTime confirmedAt;
    private String rejectedReason;
    private Boolean readyForOrganizerApproval;

    public TeamDetailDto() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getEventId() {
        return eventId;
    }

    public void setEventId(Long eventId) {
        this.eventId = eventId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<TeamMemberDto> getMembers() {
        return members;
    }

    public void setMembers(List<TeamMemberDto> members) {
        this.members = members;
    }

    public OffsetDateTime getConfirmedAt() {
        return confirmedAt;
    }

    public void setConfirmedAt(OffsetDateTime confirmedAt) {
        this.confirmedAt = confirmedAt;
    }

    public String getRejectedReason() {
        return rejectedReason;
    }

    public void setRejectedReason(String rejectedReason) {
        this.rejectedReason = rejectedReason;
    }

    public Boolean getReadyForOrganizerApproval() {
        return readyForOrganizerApproval;
    }

    public void setReadyForOrganizerApproval(Boolean readyForOrganizerApproval) {
        this.readyForOrganizerApproval = readyForOrganizerApproval;
    }
}
