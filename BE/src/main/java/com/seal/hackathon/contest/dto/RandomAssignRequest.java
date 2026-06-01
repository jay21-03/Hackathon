package com.seal.hackathon.contest.dto;

import java.util.List;
import lombok.Data;

@Data
public class RandomAssignRequest {
    private List<Long> boardIds;
    private List<Long> slotIds;
    private String seed;
    private Integer chunkSize; // optional, default 200
}
