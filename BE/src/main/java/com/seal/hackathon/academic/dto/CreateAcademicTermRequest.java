package com.seal.hackathon.academic.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.seal.hackathon.common.enums.AcademicTermStatus;
import com.seal.hackathon.common.enums.AcademicTermType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import lombok.Data;

@Data
public class CreateAcademicTermRequest {

    @NotBlank(message = "code must not be blank")
    @Size(max = 50, message = "code must not exceed 50 characters")
    @Schema(example = "FALL_2026")
    private String code;

    @NotBlank(message = "name must not be blank")
    @Size(max = 200, message = "name must not exceed 200 characters")
    @Schema(example = "Fall 2026")
    private String name;

    @NotNull(message = "year must not be null")
    @Min(value = 2000, message = "year must be at least 2000")
    @Max(value = 2100, message = "year must be at most 2100")
    @Schema(example = "2026")
    private Integer year;

    @NotNull(message = "termType must not be null")
    private AcademicTermType termType;

    @NotNull(message = "startDate must not be null")
    @Schema(example = "2026-09-01")
    private LocalDate startDate;

    @NotNull(message = "endDate must not be null")
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
