package com.seal.hackathon.scoring.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EventScoreProgressResponse {

    private Long eventId;
    private String eventName;
    private ProgressSummaryDto summary;
    private List<ScoreProgressResponse> boards;
    private List<Long> boardsWithoutJudges;
    private List<Long> boardsIncomplete;
}
