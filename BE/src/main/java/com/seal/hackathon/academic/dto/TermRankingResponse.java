package com.seal.hackathon.academic.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TermRankingResponse {
    private Long id;
    private Long roundId;
    private Long boardId;
    private Long teamId;
    private Integer rank;
    private BigDecimal averageScore;
    private OffsetDateTime publishedAt;
}
