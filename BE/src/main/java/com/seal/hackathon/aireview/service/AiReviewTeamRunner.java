package com.seal.hackathon.aireview.service;

import com.seal.hackathon.aireview.dto.AiReviewResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AiReviewTeamRunner {

    private final AiReviewService aiReviewService;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AiReviewResponse runForTeam(Long teamId) {
        return aiReviewService.triggerTeamReviewInternal(teamId);
    }
}
