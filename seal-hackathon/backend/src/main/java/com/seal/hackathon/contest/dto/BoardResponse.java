package com.seal.hackathon.contest.dto;

import com.seal.hackathon.common.enums.BoardStatus;
import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BoardResponse {
    private Long id;
    private Long roundId;
    private String name;
    private Integer boardOrder;
    private String description;
    private BoardStatus status;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
