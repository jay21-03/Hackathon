package com.seal.hackathon.github.dto;

import java.time.OffsetDateTime;

public record CommitUpdateMessage(
        Long teamId,
        Long teamRepositoryId,
        Long eventId,
        String commitSha,
        String commitMessage,
        OffsetDateTime committedAt,
        Integer commitCount) {}
