package com.seal.hackathon.award.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SuggestAwardsFromRankingResponse {

    private List<TeamAwardResponse> suggestions;
    private int created;
    private String message;
}
