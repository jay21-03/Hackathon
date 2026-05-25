package com.seal.hackathon.contest.service;

import org.springframework.stereotype.Service;

@Service
public class ProblemAccessService {

    public String skeletonStatus() {
        return "ProblemAccessService skeleton ready (access by release_at, not blocked by check-in)";
    }
}
