package com.seal.hackathon.aireview.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seal.hackathon.aireview.dto.AiReviewBulkJobResponse;
import com.seal.hackathon.aireview.dto.BulkAiReviewResponse;
import com.seal.hackathon.aireview.entity.AiReviewBulkJob;
import com.seal.hackathon.aireview.repository.AiReviewBulkJobRepository;
import com.seal.hackathon.common.enums.AiReviewBulkJobStatus;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiReviewBulkJobStore {

    private final AiReviewBulkJobRepository repository;
    private final ObjectMapper objectMapper;

    @Transactional
    public AiReviewBulkJobResponse createJob(String jobId, Long eventId, int total, Long startedBy) {
        OffsetDateTime now = OffsetDateTime.now();
        AiReviewBulkJob entity = AiReviewBulkJob.builder()
                .id(jobId)
                .eventId(eventId)
                .status(AiReviewBulkJobStatus.RUNNING)
                .total(total)
                .processed(0)
                .succeededCount(0)
                .failedCount(0)
                .startedBy(startedBy)
                .startedAt(now)
                .updatedAt(now)
                .build();
        return toResponse(repository.save(entity));
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateProgress(String jobId, int processed, int succeededCount, int failedCount) {
        AiReviewBulkJob job = requireJob(jobId);
        job.setProcessed(processed);
        job.setSucceededCount(succeededCount);
        job.setFailedCount(failedCount);
        job.setUpdatedAt(OffsetDateTime.now());
        repository.save(job);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void completeJob(String jobId, BulkAiReviewResponse result) {
        AiReviewBulkJob job = requireJob(jobId);
        job.setStatus(AiReviewBulkJobStatus.COMPLETED);
        job.setProcessed(result.getTotal());
        job.setSucceededCount(result.getSucceededCount());
        job.setFailedCount(result.getFailedCount());
        job.setResultJson(serializeResult(result));
        job.setFinishedAt(OffsetDateTime.now());
        job.setUpdatedAt(OffsetDateTime.now());
        repository.save(job);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void failJob(String jobId, String errorMessage) {
        AiReviewBulkJob job = requireJob(jobId);
        job.setStatus(AiReviewBulkJobStatus.FAILED);
        job.setErrorMessage(errorMessage);
        job.setFinishedAt(OffsetDateTime.now());
        job.setUpdatedAt(OffsetDateTime.now());
        repository.save(job);
    }

    @Transactional(readOnly = true)
    public Optional<AiReviewBulkJobResponse> findJob(String jobId, Long eventId) {
        return repository.findById(jobId)
                .filter(job -> eventId.equals(job.getEventId()))
                .map(this::toResponse);
    }

    @Transactional
    public int markRunningJobsInterrupted(String message) {
        OffsetDateTime now = OffsetDateTime.now();
        List<AiReviewBulkJob> running = repository.findByStatus(AiReviewBulkJobStatus.RUNNING);
        for (AiReviewBulkJob job : running) {
            job.setStatus(AiReviewBulkJobStatus.INTERRUPTED);
            job.setErrorMessage(message);
            job.setFinishedAt(now);
            job.setUpdatedAt(now);
        }
        repository.saveAll(running);
        return running.size();
    }

    private AiReviewBulkJob requireJob(String jobId) {
        return repository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "AI_REVIEW_JOB_NOT_FOUND"));
    }

    private AiReviewBulkJobResponse toResponse(AiReviewBulkJob job) {
        return AiReviewBulkJobResponse.builder()
                .jobId(job.getId())
                .eventId(job.getEventId())
                .status(job.getStatus().name())
                .total(job.getTotal())
                .processed(job.getProcessed())
                .succeededCount(job.getSucceededCount())
                .failedCount(job.getFailedCount())
                .result(deserializeResult(job.getResultJson()))
                .errorMessage(job.getErrorMessage())
                .startedAt(job.getStartedAt())
                .finishedAt(job.getFinishedAt())
                .build();
    }

    private String serializeResult(BulkAiReviewResponse result) {
        if (result == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(result);
        } catch (JsonProcessingException ex) {
            log.warn("Could not serialize bulk AI job result: {}", ex.getMessage());
            return null;
        }
    }

    private BulkAiReviewResponse deserializeResult(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, BulkAiReviewResponse.class);
        } catch (JsonProcessingException ex) {
            log.warn("Could not deserialize bulk AI job result: {}", ex.getMessage());
            return null;
        }
    }
}
