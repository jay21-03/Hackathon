package com.seal.hackathon.registration.repository;

import com.seal.hackathon.registration.entity.DomainEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DomainEventRepository extends JpaRepository<DomainEvent, Long> {
}
