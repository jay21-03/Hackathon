package com.seal.hackathon.github.scheduler;

import com.seal.hackathon.github.service.RepositoryProvisioningService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.github.scheduler-enabled", havingValue = "true", matchIfMissing = true)
public class RepositoryAccessScheduler {

    private final RepositoryProvisioningService repositoryProvisioningService;

    @Scheduled(fixedDelayString = "${app.github.scheduler-poll-ms:180000}")
    public void runRepositoryLifecycle() {
        int provisioned = repositoryProvisioningService.provisionDueRepositories();
        int lockedProblems = repositoryProvisioningService.closeRepositoriesForClosedProblems();
        if (provisioned > 0 || lockedProblems > 0) {
            log.info("GitHub repo scheduler: provisionedTeams={}, lockedByProblem={}", provisioned, lockedProblems);
        }
    }
}
