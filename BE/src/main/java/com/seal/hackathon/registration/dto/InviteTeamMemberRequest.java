package com.seal.hackathon.registration.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public class InviteTeamMemberRequest {

    @NotNull
    @Valid
    private InviteMemberRequest member;

    public InviteTeamMemberRequest() {
    }

    public InviteMemberRequest getMember() {
        return member;
    }

    public void setMember(InviteMemberRequest member) {
        this.member = member;
    }
}
