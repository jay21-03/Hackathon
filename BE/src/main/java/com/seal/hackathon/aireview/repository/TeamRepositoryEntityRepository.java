package com.seal.hackathon.aireview.repository;

import com.seal.hackathon.aireview.entity.TeamRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeamRepositoryEntityRepository extends JpaRepository<TeamRepository, Long> {
    List<TeamRepository> findByNextReviewAtLessThanEqual(LocalDateTime now);

    Optional<TeamRepository> findByTeamId(Long teamId);
}
