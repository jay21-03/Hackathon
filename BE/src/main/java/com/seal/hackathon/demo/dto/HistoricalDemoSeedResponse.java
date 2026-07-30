package com.seal.hackathon.demo.dto;

import java.util.ArrayList;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class HistoricalDemoSeedResponse {
    private Integer termsCreated;
    private Integer termsReused;
    private Integer eventsCreated;
    private Integer eventsReused;
    private Integer teamsCreated;
    private Integer usersCreated;
    private Integer usersReused;
    private Integer scoreSheetsCreated;
    private Integer rankingResultsCreated;
    private Integer awardsCreated;
    @Builder.Default
    private List<String> warnings = new ArrayList<>();
}
