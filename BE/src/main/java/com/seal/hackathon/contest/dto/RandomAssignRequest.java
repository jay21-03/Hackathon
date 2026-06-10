package com.seal.hackathon.contest.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import java.util.List;
import lombok.Data;

@Data
public class RandomAssignRequest {
    private List<@Positive(message = "boardId must be positive") Long> boardIds;
    private List<@Positive(message = "slotId must be positive") Long> slotIds;
    private String seed;

    @Min(value = 1, message = "chunkSize must be at least 1")
    private Integer chunkSize; // optional, default 200
}
