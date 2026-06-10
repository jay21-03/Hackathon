package com.seal.hackathon.ranking.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ExecuteAdvancementResponse {
    private int teamsAdvanced;
    private int slotsAssigned;
    private List<AdvancementResponse> advancements;
}
