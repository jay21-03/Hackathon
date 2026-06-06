package com.seal.hackathon.scoring.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ScoreProgressResponse {
    private Long boardId;
    private String boardName;
    private Long roundId;
    private ProgressSummaryDto summary;
    private List<JudgeProgressDto> judges;
    private List<TeamProgressDto> teams;
}
