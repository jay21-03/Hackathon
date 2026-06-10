package com.seal.hackathon.ranking.dto;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdvancementCandidateDto {
    private Long teamId;
    private String teamName;
    private Long fromBoardId;
    private String fromBoardName;
    private Integer rank;
    private BigDecimal averageScore;
}
