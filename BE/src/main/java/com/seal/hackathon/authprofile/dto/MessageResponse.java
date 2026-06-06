package com.seal.hackathon.authprofile.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MessageResponse {
    private String message;
    /** Chỉ trả khi MAIL_ENABLED=false và DEV_AUTH_ENABLED=true — link reset local dev. */
    private String devResetUrl;
}
