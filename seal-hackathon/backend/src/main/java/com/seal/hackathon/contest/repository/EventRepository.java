package com.seal.hackathon.contest.repository;

import com.seal.hackathon.common.enums.EventStatus;
import com.seal.hackathon.contest.entity.Event;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventRepository extends JpaRepository<Event, Long> {
	List<Event> findByStatus(EventStatus status);
}
