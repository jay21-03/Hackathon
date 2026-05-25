package com.seal.hackathon.checkin.repository;

import com.seal.hackathon.checkin.entity.CheckIn;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CheckInRepository extends JpaRepository<CheckIn, Long> {
	List<CheckIn> findByEventId(Long eventId);

	Optional<CheckIn> findByTeamMemberId(Long teamMemberId);
}
