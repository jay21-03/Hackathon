package com.seal.hackathon.ranking.dto;

import java.time.OffsetDateTime;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BoardRankingResponse {

    private Long boardId;
    private String boardName;
    private Long roundId;
    private String roundName;
    private Long eventId;
    private boolean published;
    private OffsetDateTime calculatedAt;
    private OffsetDateTime publishedAt;
    private int teamCount;
    private int hiddenTeamCount;
    private String hiddenTeamReason;
    private List<RankingTeamEntryDto> entries;
}
