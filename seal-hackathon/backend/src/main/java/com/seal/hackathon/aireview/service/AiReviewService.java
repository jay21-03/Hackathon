package com.seal.hackathon.aireview.service;

import com.seal.hackathon.aireview.dto.AiReviewRunSummary;
import org.springframework.stereotype.Service;

@Service
public class AiReviewService {

    public String skeletonStatus() {
        return "AiReviewService skeleton ready (advisory only, no ranking impact)";
    }

    public AiReviewRunSummary runScheduledReview() {
        return new AiReviewRunSummary(0, "SKELETON_ONLY");
    }
}
