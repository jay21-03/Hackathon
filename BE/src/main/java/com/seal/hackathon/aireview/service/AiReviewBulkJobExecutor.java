package com.seal.hackathon.aireview.service;

import com.seal.hackathon.aireview.dto.AiReviewResponse;
import com.seal.hackathon.aireview.dto.BulkAiReviewFailure;
import com.seal.hackathon.aireview.dto.BulkAiReviewResponse;
import com.seal.hackathon.registration.entity.Team;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Component
@RequiredArgsConstructor
public class AiReviewBulkJobExecutor {

    private final AiReviewTeamRunner aiReviewTeamRunner;
    private final AiReviewNotificationPublisher notificationPublisher;
    private final AiReviewBulkJobStore jobStore;

    @Async
    public void run(String jobId, Long eventId, List<Team> teams, Long organizerUserId) {
        List<AiReviewResponse> succeeded = new ArrayList<>();
        List<BulkAiReviewFailure> failed = new ArrayList<>();
        int processed = 0;
        int succeededCount = 0;
        int failedCount = 0;
        try {
            for (Team team : teams) {
                try {
                    succeeded.add(aiReviewTeamRunner.runForTeam(team.getId()));
                    succeededCount++;
                } catch (ResponseStatusException ex) {
                    failed.add(BulkAiReviewFailure.builder()
                            .teamId(team.getId())
                            .teamName(team.getName())
                            .reason(ex.getReason())
                            .build());
                    failedCount++;
                } catch (RuntimeException ex) {
                    failed.add(BulkAiReviewFailure.builder()
                            .teamId(team.getId())
                            .teamName(team.getName())
                            .reason(ex.getMessage())
                            .build());
                    failedCount++;
                }
                processed++;
                jobStore.updateProgress(jobId, processed, succeededCount, failedCount);
            }
            BulkAiReviewResponse result = BulkAiReviewResponse.builder()
                    .total(teams.size())
                    .succeededCount(succeeded.size())
                    .failedCount(failed.size())
                    .succeeded(succeeded)
                    .failed(failed)
                    .build();
            jobStore.completeJob(jobId, result);
            notificationPublisher.publishBulkJobFinished(
                    eventId, organizerUserId, succeeded.size(), failed.size(), teams.size());
        } catch (Exception ex) {
            log.error("AI bulk job {} failed: {}", jobId, ex.getMessage());
            jobStore.failJob(jobId, ex.getMessage());
        }
    }
}
