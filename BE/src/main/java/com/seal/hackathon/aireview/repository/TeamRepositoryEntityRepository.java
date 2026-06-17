package com.seal.hackathon.aireview.repository;

import com.seal.hackathon.aireview.entity.TeamRepository;
import com.seal.hackathon.common.enums.RepositoryAccessStatus;
import com.seal.hackathon.common.enums.RepositoryProvisionStatus;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TeamRepositoryEntityRepository extends JpaRepository<TeamRepository, Long> {
    @Deprecated
    List<TeamRepository> findByNextReviewAtLessThanEqual(java.time.LocalDateTime now);

    @Query("""
            SELECT tr FROM TeamRepository tr
            WHERE tr.provisionStatus = :provisionStatus
              AND tr.githubOwner IS NOT NULL
              AND tr.githubRepoName IS NOT NULL
              AND (tr.nextReviewAt IS NULL OR tr.nextReviewAt <= :now)
            """)
    List<TeamRepository> findDueForAiReview(
            @Param("now") OffsetDateTime now,
            @Param("provisionStatus") RepositoryProvisionStatus provisionStatus);

    Optional<TeamRepository> findFirstByTeamIdAndProblemIdIsNullOrderByUpdatedAtDesc(Long teamId);

    List<TeamRepository> findAllByTeamId(Long teamId);

    Optional<TeamRepository> findByTeamIdAndProblemId(Long teamId, Long problemId);

    List<TeamRepository> findByProblemIdOrderByTeamIdAsc(Long problemId);

    List<TeamRepository> findByRoundIdAndAccessStatus(Long roundId, RepositoryAccessStatus accessStatus);

    List<TeamRepository> findByRoundIdOrderByTeamIdAscProblemIdAsc(Long roundId);

    List<TeamRepository> findByTeamIdInOrderByTeamIdAscProblemIdAsc(List<Long> teamIds);

    Optional<TeamRepository> findByTeamId(Long teamId);

    List<TeamRepository> findByTeamIdIn(List<Long> teamIds);

    List<TeamRepository> findByGithubRepoId(Long githubRepoId);

    List<TeamRepository> findByGithubOwnerIgnoreCaseAndGithubRepoNameIgnoreCase(
            String githubOwner, String githubRepoName);

    @Query("""
            SELECT tr FROM TeamRepository tr
            WHERE tr.provisionStatus = :provisionStatus
              AND tr.githubOwner IS NOT NULL
              AND tr.githubRepoName IS NOT NULL
            ORDER BY tr.teamId ASC, tr.problemId ASC NULLS LAST, tr.id ASC
            """)
    List<TeamRepository> findReviewableByProvisionStatus(
            @Param("provisionStatus") RepositoryProvisionStatus provisionStatus);
}
