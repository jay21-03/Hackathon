package com.seal.hackathon.submission.dto;

import com.seal.hackathon.common.validation.ValidGitRepositoryUrl;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SubmitSubmissionRequest {
    @NotNull
    @Positive(message = "eventId must be greater than 0")
    private Long eventId;

    @Size(max = 2048, message = "repositoryUrl must not exceed 2048 characters")
    @ValidGitRepositoryUrl
    private String repositoryUrl;

    @Size(max = 255, message = "repositoryName must not exceed 255 characters")
    private String repositoryName;
}
