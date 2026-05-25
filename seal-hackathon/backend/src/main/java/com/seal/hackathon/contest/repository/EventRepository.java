package com.seal.hackathon.contest.repository;

import com.seal.hackathon.contest.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventRepository extends JpaRepository<Event, Long> {
}
