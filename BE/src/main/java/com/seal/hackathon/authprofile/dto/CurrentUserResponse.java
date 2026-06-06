package com.seal.hackathon.authprofile.dto;

import com.seal.hackathon.common.enums.UserStatus;
import java.util.Set;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CurrentUserResponse {
    private Long id;
    private String email;
    private String username;
    private String fullName;
    private Boolean profileCompleted;
    private Boolean hasPassword;
    private String studentId;
    private String university;
    private String avatarUrl;
    private UserStatus status;
    private Set<String> roles;
}
