package com.seal.hackathon.aireview.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AiReviewBulkJobRecovery implements ApplicationRunner {

    private final AiReviewBulkJobStore jobStore;

    @Override
    public void run(ApplicationArguments args) {
        int updated = jobStore.markRunningJobsInterrupted(
                "Job bị gián đoạn do backend restart — chạy lại «Chạy tất cả đội» nếu cần.");
        if (updated > 0) {
            log.info("Marked {} running AI bulk job(s) as INTERRUPTED after startup", updated);
        }
    }
}
