package com.seal.hackathon.contest.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MyBoardPeerDto {
    private Long teamId;
    private String teamName;
    private Integer slotNumber;
}
