package com.seal.hackathon.authprofile.dto;

import com.seal.hackathon.common.enums.UserStatus;
import java.time.OffsetDateTime;
import java.util.Set;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserSummaryResponse {
    private Long id;
    private String email;
    private String fullName;
    private UserStatus status;
    private Set<String> roles;
    private OffsetDateTime createdAt;
}
