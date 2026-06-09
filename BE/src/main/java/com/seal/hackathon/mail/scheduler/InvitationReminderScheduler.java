package com.seal.hackathon.mail.scheduler;

import com.seal.hackathon.mail.service.InvitationReminderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.invitation.reminder-enabled", havingValue = "true", matchIfMissing = true)
public class InvitationReminderScheduler {

    private final InvitationReminderService invitationReminderService;

    @Scheduled(fixedDelayString = "${app.invitation.reminder-poll-ms:3600000}")
    public void sendDueReminders() {
        var result = invitationReminderService.sendDueReminders();
        if (result.staffCount() > 0 || result.teamCount() > 0) {
            log.info("Invitation reminders queued. staff={}, team={}", result.staffCount(), result.teamCount());
        }
    }
}
