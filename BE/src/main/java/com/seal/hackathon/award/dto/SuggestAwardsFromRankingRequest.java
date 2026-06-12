package com.seal.hackathon.award.dto;

import lombok.Data;

@Data
public class SuggestAwardsFromRankingRequest {

    /** Optional — limit suggestions to a single round's published rankings. */
    private Long roundId;

    /** Optional — limit suggestions to a single board's published rankings. */
    private Long boardId;
}
