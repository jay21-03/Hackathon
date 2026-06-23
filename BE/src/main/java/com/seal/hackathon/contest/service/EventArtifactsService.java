package com.seal.hackathon.contest.service;

import com.seal.hackathon.contest.dto.EventArtifactsSummaryResponse;
import com.seal.hackathon.github.dto.RepositoryStatusStatsResponse;
import com.seal.hackathon.github.service.RepositoryProvisioningService;
import com.seal.hackathon.submission.dto.EventSubmissionSummaryResponse;
import com.seal.hackathon.submission.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EventArtifactsService {

    private final SubmissionService submissionService;
    private final RepositoryProvisioningService repositoryProvisioningService;

    @Transactional(readOnly = true)
    public EventArtifactsSummaryResponse getSummary(Long eventId) {
        EventSubmissionSummaryResponse submissions = submissionService.summarizeEventSubmissions(eventId);
        RepositoryStatusStatsResponse repositories = repositoryProvisioningService.getEventRepositoryStats(eventId);
        return EventArtifactsSummaryResponse.builder()
                .submissions(submissions)
                .repositories(repositories)
                .build();
    }
}
