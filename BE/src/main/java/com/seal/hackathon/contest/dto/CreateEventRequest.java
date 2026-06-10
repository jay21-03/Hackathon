package com.seal.hackathon.contest.dto;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.seal.hackathon.common.util.ContestTimelineValidation;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import lombok.Data;

@Data
public class CreateEventRequest {

    @NotBlank(message = "name must not be blank")
    @Size(min = 3, max = 200, message = "name must be between 3 and 200 characters")
    private String name;

    @Size(max = 10000, message = "description must not exceed 10000 characters")
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

    @NotNull(message = "academicTermId must not be null")
    private Long academicTermId;

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

    @AssertTrue(message = "startDate must be before or equal to endDate")
    @JsonIgnore
    public boolean isEventDateRangeValid() {
        return ContestTimelineValidation.isEventDateRangeValid(startDate, endDate);
    }

    @AssertTrue(message = "registrationStartAt must be before or equal to registrationEndAt")
    @JsonIgnore
    public boolean isRegistrationWindowValid() {
        return ContestTimelineValidation.isRegistrationWindowValid(registrationStartAt, registrationEndAt);
    }

    @AssertTrue(message = "registrationEndAt must be on or before event endDate")
    @JsonIgnore
    public boolean isRegistrationEndWithinEvent() {
        return ContestTimelineValidation.isRegistrationEndWithinEvent(registrationEndAt, endDate);
    }

    @AssertTrue(message = "registrationStartAt should be on or before event startDate")
    @JsonIgnore
    public boolean isRegistrationStartBeforeEvent() {
        return ContestTimelineValidation.isRegistrationStartBeforeEvent(registrationStartAt, startDate);
    }

    @AssertTrue(message = "minTeamSize and maxTeamSize are managed by the system")
    @JsonIgnore
    public boolean hasNoForbiddenTeamSizeFields() {
        return !hasForbiddenTeamSizeFields();
    }
}
