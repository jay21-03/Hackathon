package com.seal.hackathon.authprofile.security;

import com.seal.hackathon.common.enums.UserStatus;
import java.util.Set;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class CurrentUserPrincipal {
    Long userId;
    String email;
    String fullName;
    UserStatus status;
    Set<String> roles;
}
