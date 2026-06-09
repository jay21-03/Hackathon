package com.seal.hackathon.ranking.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BoardPublishReadinessDto {
    private Long boardId;
    private String boardName;
    private boolean ready;
    private List<String> blockers;
}
