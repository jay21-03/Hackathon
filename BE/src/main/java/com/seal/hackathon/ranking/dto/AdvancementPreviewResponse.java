package com.seal.hackathon.ranking.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdvancementPreviewResponse {
    private Long eventId;
    private Long fromRoundId;
    private Long toRoundId;
    private int topNPerBoard;
    /** Top-N per board — quick auto-select suggestion. */
    private List<AdvancementCandidateDto> candidates;
    /** All teams assigned in the source round, including teams that are not currently eligible. */
    private List<AdvancementCandidateDto> eligibleTeams;
}
