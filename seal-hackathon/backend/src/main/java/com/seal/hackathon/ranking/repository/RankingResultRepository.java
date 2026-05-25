package com.seal.hackathon.ranking.repository;

import com.seal.hackathon.ranking.entity.RankingResult;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RankingResultRepository extends JpaRepository<RankingResult, Long> {
}
