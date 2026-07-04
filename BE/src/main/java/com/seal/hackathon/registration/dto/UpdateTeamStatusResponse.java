package com.seal.hackathon.registration.dto;

import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTeamStatusResponse {

    private TeamDetailDto team;

    /** True when the team lost CONFIRMED eligibility and competition cleanup ran. */
    private boolean competitionCleanupApplied;
    private int boardsCleared;
    private int awardsRevoked;
    private boolean awardsEventUnpublished;
    private int advancementsRemoved;

    private WaitlistPromotionResult waitlistPromotion;

    @Builder.Default
    private List<String> nextActions = new ArrayList<>();
}
