package com.seal.hackathon.contest.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import lombok.Data;

@Data
public class UpdateEventRequest {
    private String name;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private OffsetDateTime registrationStartAt;
    private OffsetDateTime registrationEndAt;
    private Integer maxTeams;
    private Integer minTeamSize;
    private Integer maxTeamSize;
}
