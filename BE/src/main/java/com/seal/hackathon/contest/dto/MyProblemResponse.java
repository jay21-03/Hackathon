package com.seal.hackathon.contest.dto;

import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MyProblemResponse {
    private boolean available;
    /** NO_TEAM | TEAM_NOT_CONFIRMED | NOT_ASSIGNED | NO_PROBLEM | NOT_RELEASED | PROBLEM_CLOSED */
    private String reason;
    private OffsetDateTime releaseAt;
    private OffsetDateTime closeAt;
    private ProblemResponse problem;
}
