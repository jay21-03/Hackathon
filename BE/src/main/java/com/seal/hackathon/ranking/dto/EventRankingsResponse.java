package com.seal.hackathon.ranking.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EventRankingsResponse {

    private Long eventId;
    private String eventName;
    private boolean anyPublished;
    private List<BoardRankingResponse> boards;
}
