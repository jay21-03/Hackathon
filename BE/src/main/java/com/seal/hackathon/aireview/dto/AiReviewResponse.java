package com.seal.hackathon.aireview.dto;



import com.seal.hackathon.common.enums.AiReviewKind;

import com.seal.hackathon.common.enums.AiReviewStatus;

import java.math.BigDecimal;

import java.time.OffsetDateTime;

import lombok.Builder;

import lombok.Data;



@Data

@Builder

public class AiReviewResponse {

    private Long id;

    private Long teamId;

    private String teamName;

    private Long roundId;

    private Long repoCommitId;

    private String commitSha;

    private AiReviewKind reviewKind;

    private AiReviewStatus status;

    /** Handover alias: llm_started / done / error */
    private String handoverStatus;

    private BigDecimal reviewScore;

    private String summary;

    private String issues;

    private String suggestions;

    private String ragLevel;

    private String aiModel;

    private String structuredOutput;

    private String githubIssueUrl;

    private OffsetDateTime reviewedAt;

    private OffsetDateTime createdAt;

}
