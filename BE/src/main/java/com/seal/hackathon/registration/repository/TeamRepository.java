package com.seal.hackathon.registration.repository;

import com.seal.hackathon.common.enums.TeamStatus;
import com.seal.hackathon.registration.entity.Team;
import com.seal.hackathon.registration.entity.TeamMember;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TeamRepository extends JpaRepository<Team, Long> {
	List<Team> findByEventId(Long eventId);

	List<Team> findByEventIdOrderByNameAscIdAsc(Long eventId);

	Page<Team> findByEventId(Long eventId, Pageable pageable);

	List<Team> findByEventIdAndStatus(Long eventId, TeamStatus status);

	List<Team> findByEventIdAndStatusOrderByNameAscIdAsc(Long eventId, TeamStatus status);

	List<Team> findByEventIdAndStatusOrderByCreatedAtAscIdAsc(Long eventId, TeamStatus status);

	Page<Team> findByEventIdAndStatus(Long eventId, TeamStatus status, Pageable pageable);

	Optional<Team> findByIdAndEventId(Long id, Long eventId);

	boolean existsByEventIdAndNameIgnoreCase(Long eventId, String name);

	long countByEventIdAndStatus(Long eventId, TeamStatus status);

	@Query("""
			SELECT DISTINCT t FROM Team t
			LEFT JOIN TeamMember m ON m.teamId = t.id
			WHERE t.eventId = :eventId
			AND (:status IS NULL OR t.status = :status)
			AND (
				:searchPattern IS NULL
				OR LOWER(t.name) LIKE :searchPattern
				OR LOWER(m.email) LIKE :searchPattern
			)
			""")
	Page<Team> searchEventTeams(
			@Param("eventId") Long eventId,
			@Param("status") TeamStatus status,
			@Param("searchPattern") String searchPattern,
			Pageable pageable);
}
