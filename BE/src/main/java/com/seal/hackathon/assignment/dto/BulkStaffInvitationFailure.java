package com.seal.hackathon.assignment.dto;

import com.seal.hackathon.common.enums.SystemRole;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BulkStaffInvitationFailure {

    private String email;
    private SystemRole role;
    private String reason;
}
