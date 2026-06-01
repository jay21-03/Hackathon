package com.seal.hackathon.registration.dto;

import jakarta.validation.constraints.NotBlank;

public class InvitationTokenRequest {

    @NotBlank
    private String token;

    public InvitationTokenRequest() {
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}
