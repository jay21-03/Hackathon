package com.seal.hackathon.contest.dto;

import com.seal.hackathon.common.enums.RoundStatus;
import com.seal.hackathon.common.enums.RoundType;
import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RoundResponse {
    private Long id;
    private Long eventId;
    private String name;
    private RoundType roundType;
    private Integer roundOrder;
    private OffsetDateTime startAt;
    private OffsetDateTime endAt;
    private RoundStatus status;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
