package com.seal.hackathon.contest.scheduler;

import com.seal.hackathon.contest.service.EventLifecycleService;
import com.seal.hackathon.contest.service.RoundLifecycleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.event.lifecycle.scheduler-enabled", havingValue = "true", matchIfMissing = true)
public class EventLifecycleScheduler {

    private final EventLifecycleService eventLifecycleService;
    private final RoundLifecycleService roundLifecycleService;

    @Scheduled(
            initialDelayString = "${app.event.lifecycle.scheduler-initial-delay-ms:60000}",
            fixedDelayString = "${app.event.lifecycle.scheduler-poll-ms:60000}")
    public void runLifecycleTick() {
        int eventTransitions = eventLifecycleService.runScheduledTransitions();
        int roundTransitions = roundLifecycleService.syncRoundStatuses();
        if (eventTransitions > 0 || roundTransitions > 0) {
            log.info(
                    "Lifecycle scheduler tick: eventTransitions={}, roundTransitions={}",
                    eventTransitions,
                    roundTransitions);
        }
    }
}
