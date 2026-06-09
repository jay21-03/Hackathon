package com.seal.hackathon.registration.service;

import com.seal.hackathon.registration.entity.OutboxMessage;
import com.seal.hackathon.registration.repository.OutboxMessageRepository;
import java.time.OffsetDateTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class OutboxWorker {

    private static final Logger log = LoggerFactory.getLogger(OutboxWorker.class);

    private final OutboxMessageRepository outboxMessageRepository;
    private final InvitationEmailSender invitationEmailSender;
    private final int maxAttempts;

    public OutboxWorker(
            OutboxMessageRepository outboxMessageRepository,
            InvitationEmailSender invitationEmailSender,
            @Value("${app.outbox.max-attempts:5}") int maxAttempts) {
        this.outboxMessageRepository = outboxMessageRepository;
        this.invitationEmailSender = invitationEmailSender;
        this.maxAttempts = maxAttempts;
    }

    @Scheduled(fixedDelayString = "${app.outbox.poll-delay-ms:5000}")
    @Transactional
    public void processPendingMessages() {
        List<OutboxMessage> pendingMessages = outboxMessageRepository.findTop50ByProcessedFalseOrderByCreatedAtAsc();
        for (OutboxMessage message : pendingMessages) {
            if (Boolean.TRUE.equals(message.getDeadLetter())) {
                continue;
            }
            int nextAttempt = (message.getAttempts() == null ? 0 : message.getAttempts()) + 1;
            if (nextAttempt > maxAttempts) {
                message.setDeadLetter(true);
                message.setLastError("Max attempts exceeded (" + maxAttempts + ")");
                outboxMessageRepository.save(message);
                log.error(
                        "Outbox message id={} moved to dead-letter after {} attempts",
                        message.getId(),
                        maxAttempts);
                continue;
            }

            try {
                log.info(
                        "Publishing outbox message id={}, type={}, aggregateType={}, aggregateId={}",
                        message.getId(),
                        message.getEventType(),
                        message.getAggregateType(),
                        message.getAggregateId());

                if ("InvitationSent".equals(message.getEventType())) {
                    invitationEmailSender.sendFromOutboxPayload(message.getPayload());
                } else if ("StaffInvitationSent".equals(message.getEventType())) {
                    invitationEmailSender.sendStaffFromOutboxPayload(message.getPayload());
                }

                message.setAttempts(nextAttempt);
                message.setProcessed(true);
                message.setProcessedAt(OffsetDateTime.now());
                message.setLastError(null);
                outboxMessageRepository.save(message);
            } catch (Exception ex) {
                message.setAttempts(nextAttempt);
                message.setLastError(rootCauseMessage(ex));
                if (nextAttempt >= maxAttempts) {
                    message.setDeadLetter(true);
                    log.error(
                            "Outbox message id={} dead-lettered after {} attempts: {}",
                            message.getId(),
                            nextAttempt,
                            message.getLastError());
                } else {
                    log.warn(
                            "Failed to publish outbox message id={} (attempt {}/{}): {}",
                            message.getId(),
                            nextAttempt,
                            maxAttempts,
                            message.getLastError());
                }
                outboxMessageRepository.save(message);
            }
        }
    }

    private String rootCauseMessage(Throwable throwable) {
        Throwable current = throwable;
        while (current.getCause() != null && current.getCause() != current) {
            current = current.getCause();
        }
        String message = current.getMessage();
        return message == null || message.isBlank()
                ? current.getClass().getName()
                : current.getClass().getName() + ": " + message;
    }
}
