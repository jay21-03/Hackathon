package com.seal.hackathon.github.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class JudgeAccessGrantItem {
    Long repositoryId;
    Long teamId;
    String teamName;
    Long judgeId;
    String judgeUsername;
    String access;
    String status;
    String error;
}
