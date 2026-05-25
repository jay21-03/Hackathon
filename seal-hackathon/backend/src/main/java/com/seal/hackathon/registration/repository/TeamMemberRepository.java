package com.seal.hackathon.registration.repository;

import com.seal.hackathon.registration.entity.TeamMember;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
	List<TeamMember> findByTeamId(Long teamId);

	Optional<TeamMember> findByEventIdAndEmail(Long eventId, String email);
}
