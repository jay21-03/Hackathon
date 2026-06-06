package com.seal.hackathon.authprofile.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UsernameAvailabilityResponse {
    private String username;
    private boolean available;
}
