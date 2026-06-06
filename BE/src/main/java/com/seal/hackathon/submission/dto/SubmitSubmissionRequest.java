package com.seal.hackathon.submission.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SubmitSubmissionRequest {
    @NotNull
    private Long eventId;

    private String repositoryUrl;
    private String repositoryName;
}
