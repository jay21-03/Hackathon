package com.seal.hackathon.contest.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MyBoardResponse {
    private boolean assigned;
    /** NO_TEAM | TEAM_NOT_CONFIRMED | TEAM_WAITLIST | TEAM_REJECTED | TEAM_DISQUALIFIED | NOT_ASSIGNED | ROUND_NOT_STARTED */
    private String reason;
    private Long teamId;
    private Long roundId;
    private String roundName;
    private Long boardId;
    private String boardName;
    private Integer slotNumber;
    private List<MyBoardPeerDto> peers;

    public static MyBoardResponse notAssigned(String reason) {
        return MyBoardResponse.builder()
                .assigned(false)
                .reason(reason)
                .peers(List.of())
                .build();
    }
}
