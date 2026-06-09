package com.seal.hackathon.assignment.dto;

import com.seal.hackathon.common.enums.SystemRole;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.Data;

@Data
public class BulkCreateStaffInvitationRequest {

    @NotNull
    private SystemRole defaultRole;

    @NotEmpty
    @Valid
    private List<BulkStaffInvitationItem> items;
}
