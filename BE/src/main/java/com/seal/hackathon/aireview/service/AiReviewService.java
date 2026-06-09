package com.seal.hackathon.aireview.service;

import com.seal.hackathon.aireview.dto.AiReviewRunSummary;
import org.springframework.stereotype.Service;

@Service
public class AiReviewService {

    public AiReviewRunSummary runScheduledReview() {
        return new AiReviewRunSummary(0, "SKELETON_ONLY");
    }
}
