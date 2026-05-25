package com.seal.hackathon.registration.repository;

import com.seal.hackathon.common.enums.TeamStatus;
import com.seal.hackathon.registration.entity.Team;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeamRepository extends JpaRepository<Team, Long> {
	List<Team> findByEventId(Long eventId);

	List<Team> findByEventIdAndStatus(Long eventId, TeamStatus status);
}
