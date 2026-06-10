package com.seal.hackathon.registration.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Data;

@Data
public class BulkInviteTeamMembersRequest {

    @NotEmpty
    @Size(max = 50, message = "members must not exceed 50 items")
    @Valid
    private List<InviteMemberRequest> members;
}
