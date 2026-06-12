package com.seal.hackathon.registration.repository;

import com.seal.hackathon.common.enums.TeamMemberStatus;
import com.seal.hackathon.registration.entity.TeamMember;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
	List<TeamMember> findByTeamIdOrderByContactPersonDescFullNameAscIdAsc(Long teamId);

	List<TeamMember> findByUserId(Long userId);

	List<TeamMember> findByTeamIdIn(Collection<Long> teamIds);

	boolean existsByTeamIdAndUserId(Long teamId, Long userId);

	List<TeamMember> findByTeamIdAndStatus(Long teamId, com.seal.hackathon.common.enums.TeamMemberStatus status);

	Optional<TeamMember> findByEventIdAndEmail(Long eventId, String email);

	Optional<TeamMember> findByEventIdAndUserId(Long eventId, Long userId);

	List<TeamMember> findAllByEventIdAndUserId(Long eventId, Long userId);

	boolean existsByEventIdAndEmailIgnoreCase(Long eventId, String email);

	boolean existsByEventIdAndUserId(Long eventId, Long userId);

	Optional<TeamMember> findByIdAndTeamId(Long id, Long teamId);

	Optional<TeamMember> findByInviteTokenHashAndInviteNonce(String inviteTokenHash, String inviteNonce);

	long countByTeamIdAndStatus(Long teamId, TeamMemberStatus status);

	Page<TeamMember> findByEventIdAndContactPersonFalseOrderByInvitedAtDesc(Long eventId, Pageable pageable);

	Page<TeamMember> findByEventIdAndContactPersonFalseAndStatusOrderByInvitedAtDesc(
			Long eventId, TeamMemberStatus status, Pageable pageable);

	@Query("""
			SELECT tm FROM TeamMember tm
			WHERE tm.eventId = :eventId
			  AND tm.contactPerson = false
			  AND tm.status = :invitedStatus
			  AND (tm.inviteExpiresAt IS NULL OR tm.inviteExpiresAt >= :now)
			  AND (:email = '' OR LOWER(tm.email) LIKE LOWER(CONCAT('%', :email, '%')))
			""")
	Page<TeamMember> findActiveInvitations(
			@Param("eventId") Long eventId,
			@Param("invitedStatus") TeamMemberStatus invitedStatus,
			@Param("now") OffsetDateTime now,
			@Param("email") String email,
			Pageable pageable);

	@Query("""
			SELECT tm FROM TeamMember tm
			WHERE tm.eventId = :eventId
			  AND tm.contactPerson = false
			  AND tm.status = :invitedStatus
			  AND tm.inviteExpiresAt IS NOT NULL
			  AND tm.inviteExpiresAt < :now
			  AND (:email = '' OR LOWER(tm.email) LIKE LOWER(CONCAT('%', :email, '%')))
			""")
	Page<TeamMember> findExpiredInvitations(
			@Param("eventId") Long eventId,
			@Param("invitedStatus") TeamMemberStatus invitedStatus,
			@Param("now") OffsetDateTime now,
			@Param("email") String email,
			Pageable pageable);

	@Query("""
			SELECT tm FROM TeamMember tm
			WHERE tm.eventId = :eventId
			  AND tm.contactPerson = false
			  AND tm.status = :status
			  AND (:email = '' OR LOWER(tm.email) LIKE LOWER(CONCAT('%', :email, '%')))
			""")
	Page<TeamMember> findByEventIdAndStatusFiltered(
			@Param("eventId") Long eventId,
			@Param("status") TeamMemberStatus status,
			@Param("email") String email,
			Pageable pageable);

	@Query("""
			SELECT tm FROM TeamMember tm
			WHERE tm.contactPerson = false
			  AND tm.status = :status
			  AND tm.inviteExpiresAt IS NOT NULL
			  AND tm.inviteExpiresAt > :now
			  AND tm.inviteExpiresAt <= :deadline
			  AND tm.reminderSentAt IS NULL
			""")
	List<TeamMember> findDueForReminder(
			@Param("status") TeamMemberStatus status,
			@Param("now") OffsetDateTime now,
			@Param("deadline") OffsetDateTime deadline);

}
