package com.seal.hackathon.contest.dto;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import lombok.Data;

@Data
public class UpdateEventRequest {
    private String name;
    private String description;
    @Schema(example = "2026-06-01")
    private LocalDate startDate;
    @Schema(example = "2026-06-02")
    private LocalDate endDate;
    @Schema(type = "string", example = "2026-05-25T08:00:00")
    private OffsetDateTime registrationStartAt;
    @Schema(type = "string", example = "2026-05-31T23:59:00")
    private OffsetDateTime registrationEndAt;
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
