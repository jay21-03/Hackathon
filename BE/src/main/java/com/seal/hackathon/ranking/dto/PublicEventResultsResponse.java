package com.seal.hackathon.ranking.dto;

import java.time.OffsetDateTime;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PublicEventResultsResponse {

    private Long eventId;
    private String eventName;
    private boolean published;
    private OffsetDateTime publishedAt;
    private List<BoardRankingResponse> boards;
}
