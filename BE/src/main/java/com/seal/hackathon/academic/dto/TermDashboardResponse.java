package com.seal.hackathon.academic.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TermDashboardResponse {
    private AcademicTermSummary academicTerm;
    private long eventCount;
    private long teamCount;
    private long participantCount;
    private long mentorCount;
    private long judgeCount;
    private long rankingCount;
    private long repositoryCount;
    private long scoreSheetCount;
}
