package com.seal.hackathon.registration.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import lombok.Data;

@Data
public class BulkInviteTeamMembersRequest {

    @NotEmpty
    @Valid
    private List<MemberRequest> members;
}
