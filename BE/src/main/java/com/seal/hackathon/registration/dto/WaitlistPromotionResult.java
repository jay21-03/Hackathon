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
public class WaitlistPromotionResult {

    private int availableSlots;
    private int promotedCount;
    /** Null when promotion ran; otherwise EVENT_IN_PROGRESS / EVENT_NOT_ELIGIBLE / NO_CAPACITY. */
    private String skippedReason;

    @Builder.Default
    private List<TeamBriefDto> promotedTeams = new ArrayList<>();

    @Builder.Default
    private List<TeamBriefDto> skippedIncompleteTeams = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TeamBriefDto {
        private Long id;
        private String name;
    }
}
