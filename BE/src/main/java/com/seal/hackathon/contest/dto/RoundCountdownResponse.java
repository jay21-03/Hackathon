package com.seal.hackathon.contest.dto;

import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoundCountdownResponse {
    private String status; // NOT_STARTED | RUNNING | ENDED
    private long remainingSeconds; // >= 0
}
