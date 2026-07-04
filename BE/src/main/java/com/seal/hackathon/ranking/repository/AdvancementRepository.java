package com.seal.hackathon.ranking.repository;

import com.seal.hackathon.ranking.entity.Advancement;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdvancementRepository extends JpaRepository<Advancement, Long> {
	List<Advancement> findByToRoundIdOrderByCreatedAtDescIdDesc(Long toRoundId);

	List<Advancement> findByTeamId(Long teamId);

	void deleteByTeamId(Long teamId);
}
