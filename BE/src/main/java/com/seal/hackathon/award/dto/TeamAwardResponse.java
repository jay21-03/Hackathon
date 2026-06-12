package com.seal.hackathon.award.dto;

import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TeamAwardResponse {

    private Long id;
    private Long eventId;
    private Long roundId;
    private Long awardCategoryId;
    private String awardCategoryName;
    private String awardCategoryCode;
    private Long teamId;
    private String teamName;
    private Long awardedBy;
    private OffsetDateTime awardedAt;
    private String note;
    private boolean published;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
