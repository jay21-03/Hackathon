package com.seal.hackathon.academic.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AcademicTermSummary {
    private Long id;
    private String code;
    private String name;
}
