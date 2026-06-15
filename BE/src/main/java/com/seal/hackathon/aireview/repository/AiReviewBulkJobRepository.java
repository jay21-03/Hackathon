package com.seal.hackathon.aireview.repository;

import com.seal.hackathon.aireview.entity.AiReviewBulkJob;
import com.seal.hackathon.common.enums.AiReviewBulkJobStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiReviewBulkJobRepository extends JpaRepository<AiReviewBulkJob, String> {

    List<AiReviewBulkJob> findByEventIdOrderByStartedAtDesc(Long eventId);

    List<AiReviewBulkJob> findByStatus(AiReviewBulkJobStatus status);
}
