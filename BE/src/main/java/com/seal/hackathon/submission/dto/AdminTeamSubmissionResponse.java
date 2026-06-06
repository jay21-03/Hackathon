package com.seal.hackathon.submission.dto;

import com.seal.hackathon.common.enums.SubmissionStatus;
import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminTeamSubmissionResponse {
    private Long teamId;
    private String teamName;
    private Long boardId;
    private String boardName;
    private Integer slotNumber;
    private SubmissionStatus status;
    private String repositoryUrl;
    private String repositoryName;
    private OffsetDateTime submittedAt;
}
