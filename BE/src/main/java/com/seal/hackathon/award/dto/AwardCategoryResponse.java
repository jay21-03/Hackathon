package com.seal.hackathon.award.dto;

import com.seal.hackathon.award.enums.AwardType;
import java.time.OffsetDateTime;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AwardCategoryResponse {

    private Long id;
    private Long eventId;
    private Long roundId;
    private String name;
    private String code;
    private String description;
    private AwardType awardType;
    private Integer rankOrder;
    private int maxWinners;
    private String prizeValue;
    private int sortOrder;
    private boolean isActive;
    private int winnerCount;
    private List<TeamAwardResponse> winners;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
