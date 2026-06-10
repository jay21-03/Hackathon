package com.seal.hackathon.academic.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.seal.hackathon.common.enums.AcademicTermStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.AssertTrue;
import java.time.LocalDate;
import lombok.Data;

@Data
public class UpdateAcademicTermRequest {

    private String name;

    @Schema(example = "2026-09-01")
    private LocalDate startDate;

    @Schema(example = "2026-12-31")
    private LocalDate endDate;

    private AcademicTermStatus status;

    @AssertTrue(message = "startDate must be before endDate")
    @JsonIgnore
    public boolean isDateRangeValid() {
        if (startDate == null || endDate == null) {
            return true;
        }
        return startDate.isBefore(endDate);
    }
}
