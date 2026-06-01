package com.seal.hackathon.registration.repository;

import com.seal.hackathon.registration.entity.TeamMember;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
	List<TeamMember> findByTeamId(Long teamId);


	boolean existsByTeamIdAndUserId(Long teamId, Long userId);

	List<TeamMember> findByTeamIdAndStatus(Long teamId, com.seal.hackathon.common.enums.TeamMemberStatus status);

	Optional<TeamMember> findByEventIdAndEmail1(Long eventId, String email);

	Optional<TeamMember> findByEventIdAndUserId(Long eventId, Long userId);

	List<TeamMember> findAllByEventIdAndUserId(Long eventId, Long userId);

	boolean existsByEventIdAndEmailIgnoreCase(Long eventId, String email);

	boolean existsByEventIdAndUserId(Long eventId, Long userId);

	Optional<TeamMember> findByIdAndTeamId(Long id, Long teamId);

	Optional<TeamMember> findByInviteTokenHashAndInviteNonce(String inviteTokenHash, String inviteNonce);

	long countByTeamIdAndStatus(Long teamId, com.seal.hackathon.common.enums.TeamMemberStatus status);
	Optional<TeamMember> findByEventIdAndEmail(Long eventId, String email);

}
