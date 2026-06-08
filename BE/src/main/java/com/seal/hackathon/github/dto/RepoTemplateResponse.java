package com.seal.hackathon.github.dto;

import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class RepoTemplateResponse {
    Long id;
    Long problemId;
    String templateOwner;
    String templateRepo;
    String defaultBranch;
    Boolean enabled;
    Long createdBy;
    OffsetDateTime createdAt;
    OffsetDateTime updatedAt;
}
