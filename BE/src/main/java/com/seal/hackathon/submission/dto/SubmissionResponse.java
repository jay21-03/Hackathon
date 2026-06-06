package com.seal.hackathon.submission.dto;

import com.seal.hackathon.common.enums.SubmissionStatus;
import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SubmissionResponse {
    private Long teamId;
    private String teamName;
    private SubmissionStatus status;
    private String repositoryUrl;
    private String repositoryName;
    private OffsetDateTime submittedAt;
    private OffsetDateTime deadlineAt;
    private boolean canSubmit;
    private boolean editable;
    private String blockReason;
}
