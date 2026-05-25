package com.seal.hackathon.scoring.repository;

import com.seal.hackathon.scoring.entity.ScoreItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScoreItemRepository extends JpaRepository<ScoreItem, Long> {
}
