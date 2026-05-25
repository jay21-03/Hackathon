package com.seal.hackathon.scoring.repository;

import com.seal.hackathon.scoring.entity.ScoreSheet;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScoreSheetRepository extends JpaRepository<ScoreSheet, Long> {
}
