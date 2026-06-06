package com.seal.hackathon.submission.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SaveSubmissionDraftRequest {
    @NotNull
    private Long eventId;

    @NotBlank
    private String repositoryUrl;

    private String repositoryName;
}
