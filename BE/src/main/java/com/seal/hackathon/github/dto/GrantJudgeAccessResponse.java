package com.seal.hackathon.github.dto;

import java.util.List;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class GrantJudgeAccessResponse {
    Long roundId;
    int totalRepositories;
    int totalJudges;
    int grantedCount;
    int failedCount;
    int skippedCount;
    List<JudgeAccessGrantItem> grants;
}
