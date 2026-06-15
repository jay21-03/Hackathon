package com.seal.hackathon.aireview.service;

import com.seal.hackathon.aireview.dto.AiReviewBulkJobResponse;
import com.seal.hackathon.aireview.dto.BulkAiReviewResponse;
import com.seal.hackathon.authprofile.security.CurrentUserProvider;
import com.seal.hackathon.common.security.OrganizerAuthorizationService;
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.repository.TeamRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AiReviewBulkJobService {

    private final OrganizerAuthorizationService organizerAuthorizationService;
    private final TeamRepository teamRepository;
    private final AiReviewService aiReviewService;
    private final AiReviewBulkJobExecutor jobExecutor;
    private final CurrentUserProvider currentUserProvider;
    private final AiReviewBulkJobStore jobStore;

    public AiReviewBulkJobResponse startEventReviewJob(Long eventId) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        if (!aiReviewService.isConfigured()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "AI_REVIEW_NOT_CONFIGURED");
        }
        String jobId = UUID.randomUUID().toString();
        List<Team> teams = teamRepository.findByEventIdOrderByNameAscIdAsc(eventId);
        Long organizerUserId = currentUserProvider.getCurrentUser().getUserId();
        AiReviewBulkJobResponse job = jobStore.createJob(jobId, eventId, teams.size(), organizerUserId);
        jobExecutor.run(jobId, eventId, teams, organizerUserId);
        return job;
    }

    public AiReviewBulkJobResponse getJob(Long eventId, String jobId) {
        organizerAuthorizationService.requireEventOwnedByCurrentOrganizer(eventId);
        return jobStore.findJob(jobId, eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "AI_REVIEW_JOB_NOT_FOUND"));
    }

    public BulkAiReviewResponse triggerEventReviewsSync(Long eventId) {
        return aiReviewService.triggerEventReviews(eventId);
    }
}
