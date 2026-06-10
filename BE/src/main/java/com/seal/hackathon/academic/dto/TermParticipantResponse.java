package com.seal.hackathon.academic.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TermParticipantResponse {
    private Long id;
    private Long teamId;
    private Long eventId;
    private String email;
    private String fullName;
    private String status;
}
