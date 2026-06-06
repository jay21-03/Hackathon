package com.seal.hackathon.ranking.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CalculateRankingResponse {

    private int boardsCalculated;
    private int teamsRanked;
    /** Số bảng vừa được công bố trong lần gọi publish (không tính bảng đã công bố trước). */
    private int newlyPublishedBoards;
    private String message;
}
