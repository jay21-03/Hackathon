package com.seal.hackathon.academic.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.seal.hackathon.common.enums.AcademicTermStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import lombok.Data;
import org.springframework.util.StringUtils;

@Data
public class UpdateAcademicTermRequest {

    @Size(max = 200, message = "name must not exceed 200 characters")
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

    @AssertTrue(message = "name must not be blank")
    @JsonIgnore
    public boolean isNameValidWhenProvided() {
        return name == null || StringUtils.hasText(name);
    }
}
