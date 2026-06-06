package com.seal.hackathon.scoring.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LevelDescriptorDto {
    private String level;
    private String label;
    private BigDecimal minScore;
    private BigDecimal maxScore;
    private String description;
}
