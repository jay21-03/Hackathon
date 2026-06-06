package com.seal.hackathon.registration.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public class InviteTeamMemberRequest {

    @NotNull
    @Valid
    private MemberRequest member;

    public InviteTeamMemberRequest() {
    }

    public MemberRequest getMember() {
        return member;
    }

    public void setMember(MemberRequest member) {
        this.member = member;
    }
}
