package com.seal.hackathon.assignment.dto;

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
    private Long assigneeId; // mentorId or judgeId
    private OffsetDateTime createdAt;
    private Long createdBy;
}
