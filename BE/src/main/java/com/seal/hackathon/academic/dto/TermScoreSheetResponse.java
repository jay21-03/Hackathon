package com.seal.hackathon.academic.dto;

import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TermScoreSheetResponse {
    private Long id;
    private Long boardId;
    private Long teamId;
    private Long judgeId;
    private String status;
    private OffsetDateTime submittedAt;
    private OffsetDateTime createdAt;
}
