package com.seal.hackathon.common.util;

import com.seal.hackathon.aireview.entity.TeamRepository;
import com.seal.hackathon.common.enums.RepositoryProvisionStatus;
import com.seal.hackathon.common.enums.SubmissionStatus;
import java.time.OffsetDateTime;
import org.springframework.util.StringUtils;

public final class SubmissionLifecycle {

    private SubmissionLifecycle() {}

    public static boolean isDeadlinePassed(OffsetDateTime closeAt) {
        return closeAt != null && !OffsetDateTime.now().isBefore(closeAt);
    }

    public static boolean hasSubmittableContent(TeamRepository repository) {
        if (repository == null || !StringUtils.hasText(repository.getRepositoryUrl())) {
            return false;
        }
        if (repository.getProvisionStatus() == RepositoryProvisionStatus.CREATED) {
            return true;
        }
        return repository.getProblemId() == null;
    }

    public static SubmissionStatus effectiveStatus(TeamRepository repository, OffsetDateTime closeAt) {
        if (repository == null) {
            return null;
        }
        if (repository.getStatus() == SubmissionStatus.SUBMITTED) {
            return SubmissionStatus.SUBMITTED;
        }
        if (isDeadlinePassed(closeAt) && hasSubmittableContent(repository)) {
            return SubmissionStatus.SUBMITTED;
        }
        return repository.getStatus();
    }

    public static OffsetDateTime effectiveSubmittedAt(TeamRepository repository, OffsetDateTime closeAt) {
        if (repository == null) {
            return null;
        }
        if (repository.getSubmittedAt() != null) {
            return repository.getSubmittedAt();
        }
        if (effectiveStatus(repository, closeAt) == SubmissionStatus.SUBMITTED) {
            return closeAt != null ? closeAt : OffsetDateTime.now();
        }
        return null;
    }

    public static void finalizeAtClose(TeamRepository repository, OffsetDateTime closeAt, OffsetDateTime now) {
        if (repository == null || repository.getStatus() == SubmissionStatus.SUBMITTED) {
            return;
        }
        if (!hasSubmittableContent(repository)) {
            return;
        }
        repository.setStatus(SubmissionStatus.SUBMITTED);
        repository.setSubmittedAt(closeAt != null ? closeAt : now);
    }
}
