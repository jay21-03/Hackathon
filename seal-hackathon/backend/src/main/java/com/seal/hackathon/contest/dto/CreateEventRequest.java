package com.seal.hackathon.contest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import lombok.Data;

@Data
public class CreateEventRequest {

    @NotBlank(message = "name must not be blank")
    private String name;

    private String description;

    @NotNull(message = "startDate must not be null")
    private LocalDate startDate;

    @NotNull(message = "endDate must not be null")
    private LocalDate endDate;

    @NotNull(message = "registrationStartAt must not be null")
    private OffsetDateTime registrationStartAt;

    @NotNull(message = "registrationEndAt must not be null")
    private OffsetDateTime registrationEndAt;

    @NotNull(message = "maxTeams must not be null")
    private Integer maxTeams;

    @NotNull(message = "minTeamSize must not be null")
    private Integer minTeamSize;

    @NotNull(message = "maxTeamSize must not be null")
    private Integer maxTeamSize;
}
