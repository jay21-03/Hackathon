package com.seal.hackathon.scoring.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BoardBriefDto {
    private Long id;
    private String name;
    private Long roundId;
    private String roundName;
}
