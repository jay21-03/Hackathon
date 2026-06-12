package com.seal.hackathon.registration.repository;

import com.seal.hackathon.common.enums.TeamStatus;
import com.seal.hackathon.registration.entity.Team;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeamRepository extends JpaRepository<Team, Long> {
	List<Team> findByEventId(Long eventId);

	List<Team> findByEventIdOrderByNameAscIdAsc(Long eventId);

	Page<Team> findByEventId(Long eventId, Pageable pageable);

	List<Team> findByEventIdAndStatus(Long eventId, TeamStatus status);

	List<Team> findByEventIdAndStatusOrderByNameAscIdAsc(Long eventId, TeamStatus status);

	Page<Team> findByEventIdAndStatus(Long eventId, TeamStatus status, Pageable pageable);

	Optional<Team> findByIdAndEventId(Long id, Long eventId);

	boolean existsByEventIdAndNameIgnoreCase(Long eventId, String name);

	long countByEventIdAndStatus(Long eventId, TeamStatus status);
}
