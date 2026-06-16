package com.seal.hackathon.assignment.dto;

import com.seal.hackathon.common.enums.SystemRole;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StaffCarryoverSuccess {

    private Long userId;
    private String email;
    private String fullName;
    private SystemRole role;
}
