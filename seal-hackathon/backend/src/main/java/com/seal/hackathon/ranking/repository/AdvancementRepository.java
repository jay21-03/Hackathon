package com.seal.hackathon.ranking.repository;

import com.seal.hackathon.ranking.entity.Advancement;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdvancementRepository extends JpaRepository<Advancement, Long> {
}
