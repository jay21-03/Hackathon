package com.seal.hackathon.award.repository;

import com.seal.hackathon.award.entity.TeamAward;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
public interface TeamAwardRepository extends JpaRepository<TeamAward, Long> {

    List<TeamAward> findByEventIdOrderByAwardCategoryIdAscIdAsc(Long eventId);

    List<TeamAward> findByEventIdAndPublishedTrueOrderByAwardCategoryIdAscIdAsc(Long eventId);

    List<TeamAward> findByAwardCategoryIdOrderByAwardedAtAscIdAsc(Long awardCategoryId);

    long countByAwardCategoryId(Long awardCategoryId);

    boolean existsByAwardCategoryIdAndTeamId(Long awardCategoryId, Long teamId);

    Optional<TeamAward> findByIdAndEventId(Long id, Long eventId);

    List<TeamAward> findByTeamId(Long teamId);

    void deleteByTeamId(Long teamId);
}
