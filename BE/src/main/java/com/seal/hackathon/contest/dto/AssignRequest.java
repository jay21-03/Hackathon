package com.seal.hackathon.contest.dto;

import lombok.Data;

@Data
public class AssignRequest {
    private Long teamId;
    private Boolean forceReplace = false;
}
