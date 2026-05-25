package com.seal.hackathon.registration.repository;

import com.seal.hackathon.registration.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeamRepository extends JpaRepository<Team, Long> {
}
