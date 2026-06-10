package com.seal.hackathon.ranking.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdvancementResponse {
    private Long id;
    private Long fromRoundId;
    private Long fromBoardId;
    private Long toRoundId;
    private Long toBoardId;
    private Long teamId;
    private String teamName;
    private Integer basisRank;
    private BigDecimal basisScore;
    private OffsetDateTime createdAt;
}
