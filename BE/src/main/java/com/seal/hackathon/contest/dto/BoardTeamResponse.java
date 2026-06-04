package com.seal.hackathon.contest.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BoardTeamResponse {
    private Long slotId;
    private Integer slotNumber;
    private Long teamId;
    private String teamName;
    private String teamStatus;
}
