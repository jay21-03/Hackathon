package com.seal.hackathon.academic.dto;

import com.seal.hackathon.common.enums.AcademicTermStatus;
import com.seal.hackathon.common.enums.AcademicTermType;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AcademicTermResponse {
    private Long id;
    private String code;
    private String name;
    private Integer year;
    private AcademicTermType termType;
    private LocalDate startDate;
    private LocalDate endDate;
    private AcademicTermStatus status;
    private Long eventCount;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
