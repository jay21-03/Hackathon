package com.seal.hackathon.ranking.repository;

import com.seal.hackathon.ranking.entity.Advancement;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdvancementRepository extends JpaRepository<Advancement, Long> {
	List<Advancement> findByToRoundId(Long toRoundId);
}
