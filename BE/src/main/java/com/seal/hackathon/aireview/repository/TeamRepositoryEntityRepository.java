package com.seal.hackathon.aireview.repository;

import com.seal.hackathon.aireview.entity.TeamRepository;
import com.seal.hackathon.common.enums.RepositoryAccessStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeamRepositoryEntityRepository extends JpaRepository<TeamRepository, Long> {
    List<TeamRepository> findByNextReviewAtLessThanEqual(LocalDateTime now);

    Optional<TeamRepository> findFirstByTeamIdAndProblemIdIsNullOrderByUpdatedAtDesc(Long teamId);

    List<TeamRepository> findAllByTeamId(Long teamId);

    Optional<TeamRepository> findByTeamIdAndProblemId(Long teamId, Long problemId);

    List<TeamRepository> findByProblemIdOrderByTeamIdAsc(Long problemId);

    List<TeamRepository> findByRoundIdAndAccessStatus(Long roundId, RepositoryAccessStatus accessStatus);

    List<TeamRepository> findByTeamIdInOrderByTeamIdAscProblemIdAsc(List<Long> teamIds);
}
