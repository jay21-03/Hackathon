package com.seal.hackathon.contest.dto;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import lombok.Data;

@Data
public class CreateEventRequest {

    @NotBlank(message = "name must not be blank")
    private String name;

    private String description;

    @NotNull(message = "startDate must not be null")
    @Schema(example = "2026-06-01")
    private LocalDate startDate;

    @NotNull(message = "endDate must not be null")
    @Schema(example = "2026-06-02")
    private LocalDate endDate;

    @NotNull(message = "registrationStartAt must not be null")
    @Schema(type = "string", example = "2026-05-25T08:00:00")
    private OffsetDateTime registrationStartAt;

    @NotNull(message = "registrationEndAt must not be null")
    @Schema(type = "string", example = "2026-05-31T23:59:00")
    private OffsetDateTime registrationEndAt;

    @NotNull(message = "maxTeams must not be null")
    @Min(value = 1, message = "maxTeams must be greater than 0")
    private Integer maxTeams;

    @JsonIgnore
    private final Map<String, Object> extraFields = new HashMap<>();

    @JsonAnySetter
    public void putExtraField(String name, Object value) {
        extraFields.put(name, value);
    }

    public boolean hasForbiddenTeamSizeFields() {
        return extraFields.containsKey("minTeamSize")
                || extraFields.containsKey("maxTeamSize")
                || extraFields.containsKey("min_team_size")
                || extraFields.containsKey("max_team_size");
    }
}
