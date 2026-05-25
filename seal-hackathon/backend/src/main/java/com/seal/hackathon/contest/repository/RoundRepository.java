package com.seal.hackathon.contest.repository;

import com.seal.hackathon.contest.entity.Round;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoundRepository extends JpaRepository<Round, Long> {
	List<Round> findByEventId(Long eventId);

	boolean existsByEventIdAndRoundOrder(Long eventId, Integer roundOrder);

	boolean existsByEventIdAndRoundOrderAndIdNot(Long eventId, Integer roundOrder, Long id);
}
