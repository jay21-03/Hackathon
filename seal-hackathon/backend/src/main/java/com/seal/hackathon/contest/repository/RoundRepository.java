package com.seal.hackathon.contest.repository;

import com.seal.hackathon.contest.entity.Round;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoundRepository extends JpaRepository<Round, Long> {
}
