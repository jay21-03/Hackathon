package com.seal.hackathon.registration.service;

import com.seal.hackathon.registration.entity.OutboxMessage;
import com.seal.hackathon.registration.repository.OutboxMessageRepository;
import java.time.OffsetDateTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class OutboxWorker {

    private static final Logger log = LoggerFactory.getLogger(OutboxWorker.class);

    private final OutboxMessageRepository outboxMessageRepository;
    private final InvitationEmailSender invitationEmailSender;

    public OutboxWorker(OutboxMessageRepository outboxMessageRepository, InvitationEmailSender invitationEmailSender) {
        this.outboxMessageRepository = outboxMessageRepository;
        this.invitationEmailSender = invitationEmailSender;
    }

    @Scheduled(fixedDelayString = "${app.outbox.poll-delay-ms:5000}")
    @Transactional
    public void processPendingMessages() {
        List<OutboxMessage> pendingMessages = outboxMessageRepository.findByProcessedFalseOrderByCreatedAtAsc();
        for (OutboxMessage message : pendingMessages) {
            try {
                log.info("Publishing outbox message id={}, type={}, aggregateType={}, aggregateId={}",
                        message.getId(), message.getEventType(), message.getAggregateType(), message.getAggregateId());

                if ("InvitationSent".equals(message.getEventType())) {
                    invitationEmailSender.sendFromOutboxPayload(message.getPayload());
                }

                message.setAttempts(message.getAttempts() == null ? 1 : message.getAttempts() + 1);
                message.setProcessed(true);
                message.setProcessedAt(OffsetDateTime.now());
                message.setLastError(null);
                outboxMessageRepository.save(message);
            } catch (Exception ex) {
                message.setAttempts(message.getAttempts() == null ? 1 : message.getAttempts() + 1);
                message.setLastError(rootCauseMessage(ex));
                outboxMessageRepository.save(message);
                log.warn("Failed to publish outbox message id={}: {}", message.getId(), rootCauseMessage(ex), ex);
            }
        }
    }

    private String rootCauseMessage(Throwable throwable) {
        Throwable current = throwable;
        while (current.getCause() != null && current.getCause() != current) {
            current = current.getCause();
        }
        String message = current.getMessage();
        return message == null || message.isBlank() ? current.getClass().getName() : current.getClass().getName() + ": " + message;
    }
}
