package com.seal.hackathon.scoring.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class JudgeBriefDto {
    private Long id;
    private String fullName;
}
