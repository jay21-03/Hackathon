package com.seal.hackathon.authprofile.security;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class VerifiedGoogleUser {
    String googleSub;
    String email;
    String fullName;
    String avatarUrl;
}
