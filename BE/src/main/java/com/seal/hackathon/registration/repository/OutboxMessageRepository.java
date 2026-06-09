package com.seal.hackathon.registration.repository;

import com.seal.hackathon.registration.entity.OutboxMessage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OutboxMessageRepository extends JpaRepository<OutboxMessage, Long> {
    List<OutboxMessage> findByProcessedFalseOrderByCreatedAtAsc();

    List<OutboxMessage> findTop50ByProcessedFalseOrderByCreatedAtAsc();
}
