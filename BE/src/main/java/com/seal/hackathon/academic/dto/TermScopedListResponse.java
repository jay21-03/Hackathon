package com.seal.hackathon.academic.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TermScopedListResponse<T> {
    private AcademicTermSummary academicTerm;
    private List<T> items;
    private int totalElements;
    /** Present when client passed page or size query params. */
    private Integer page;
    private Integer size;
    private Integer totalPages;
}
