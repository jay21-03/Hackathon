package com.seal.hackathon.registration.dto;

import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

public class RegisterTeamRequest {
    @NotBlank
    @Size(min = 3, max = 100)
    private String name;

    @NotEmpty
    @Valid
    private List<MemberRequest> members;

    public RegisterTeamRequest() {
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<MemberRequest> getMembers() {
        return members;
    }

    public void setMembers(List<MemberRequest> members) {
        this.members = members;
    }
}
