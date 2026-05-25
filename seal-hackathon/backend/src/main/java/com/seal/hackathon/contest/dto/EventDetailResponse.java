package com.seal.hackathon.contest.dto;

import com.seal.hackathon.common.enums.EventStatus;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EventDetailResponse {
    private Long id;
    private String name;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private OffsetDateTime registrationStartAt;
    private OffsetDateTime registrationEndAt;
    private Integer maxTeams;
    private Integer minTeamSize;
    private Integer maxTeamSize;
    private EventStatus status;
}
