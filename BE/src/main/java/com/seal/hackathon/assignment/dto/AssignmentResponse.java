package com.seal.hackathon.assignment.dto;

import com.seal.hackathon.common.enums.JudgeBoardReadiness;
import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentResponse {
    private Long id;
    private Long boardId;
    private String boardName;
    private Long roundId;
    private String roundName;
    private Long eventId;
    private String eventName;
    private Long assigneeId; // mentorId or judgeId
    private OffsetDateTime createdAt;
    private Long createdBy;
    private JudgeBoardReadiness readiness;
    private Integer teamsCount;
    private Integer submittedSheetsCount;
    private Integer draftSheetsCount;
    private OffsetDateTime problemReleaseAt;
    private OffsetDateTime problemCloseAt;
}
