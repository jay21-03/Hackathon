package com.seal.hackathon.ranking.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PublishReadinessResponse {
    private Long eventId;
    private boolean ready;
    private List<String> blockers;
    private List<BoardPublishReadinessDto> boards;
}
