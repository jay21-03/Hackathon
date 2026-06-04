package com.seal.hackathon.contest.dto;

import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProblemResponse {
    private Long id;
    private Long boardId;
    private String title;
    private String description;
    private String attachmentUrl;
    private String externalLink;
    private OffsetDateTime releaseAt;
    private OffsetDateTime closeAt;
    private Long createdBy;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
