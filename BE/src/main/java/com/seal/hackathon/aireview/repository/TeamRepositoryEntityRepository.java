package com.seal.hackathon.aireview.repository;

import com.seal.hackathon.aireview.entity.TeamRepository;
import com.seal.hackathon.common.enums.RepositoryAccessStatus;
import com.seal.hackathon.common.enums.RepositoryProvisionStatus;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    @Query("""
            SELECT tr FROM TeamRepository tr
            JOIN Team t ON t.id = tr.teamId
            WHERE t.eventId = :eventId
              AND (:roundId IS NULL OR tr.roundId = :roundId)
              AND (:boardId IS NULL OR tr.boardId = :boardId)
              AND (:accessStatus IS NULL OR tr.accessStatus = :accessStatus)
              AND (:q = '' OR LOWER(t.name) LIKE LOWER(CONCAT('%', :q, '%')))
            ORDER BY t.name ASC, tr.problemId ASC NULLS LAST, tr.id ASC
            """)
    Page<TeamRepository> findByEventFiltered(
            @Param("eventId") Long eventId,
            @Param("roundId") Long roundId,
            @Param("boardId") Long boardId,
            @Param("accessStatus") RepositoryAccessStatus accessStatus,
            @Param("q") String q,
            Pageable pageable);

    @Query("""
            SELECT
              COUNT(tr) AS total,
              COALESCE(SUM(CASE WHEN tr.accessStatus = com.seal.hackathon.common.enums.RepositoryAccessStatus.OPEN THEN 1 ELSE 0 END), 0) AS openCount,
              COALESCE(SUM(CASE WHEN tr.accessStatus = com.seal.hackathon.common.enums.RepositoryAccessStatus.CLOSED THEN 1 ELSE 0 END), 0) AS closedCount,
              COALESCE(SUM(CASE WHEN tr.accessStatus = com.seal.hackathon.common.enums.RepositoryAccessStatus.PENDING THEN 1 ELSE 0 END), 0) AS pendingCount,
              COALESCE(SUM(CASE WHEN tr.accessStatus = com.seal.hackathon.common.enums.RepositoryAccessStatus.FAILED
                OR tr.provisionStatus = com.seal.hackathon.common.enums.RepositoryProvisionStatus.FAILED THEN 1 ELSE 0 END), 0) AS failedCount,
              COALESCE(SUM(CASE WHEN tr.provisionStatus = com.seal.hackathon.common.enums.RepositoryProvisionStatus.CREATED THEN 1 ELSE 0 END), 0) AS createdCount,
              COALESCE(SUM(CASE WHEN tr.provisionStatus = com.seal.hackathon.common.enums.RepositoryProvisionStatus.FAILED
                AND tr.lastError IS NOT NULL
                AND (
                  LOWER(tr.lastError) LIKE '%github%'
                  OR LOWER(tr.lastError) LIKE '%username%'
                  OR LOWER(tr.lastError) LIKE '%thiếu%'
                  OR LOWER(tr.lastError) LIKE '%invalid%'
                ) THEN 1 ELSE 0 END), 0) AS githubIssueCount
            FROM TeamRepository tr
            JOIN Team t ON t.id = tr.teamId
            WHERE t.eventId = :eventId
              AND (:roundId IS NULL OR tr.roundId = :roundId)
              AND (:boardId IS NULL OR tr.boardId = :boardId)
              AND (:accessStatus IS NULL OR tr.accessStatus = :accessStatus)
              AND (:q = '' OR LOWER(t.name) LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    RepositoryStatusStatsProjection summarizeByEventFiltered(
            @Param("eventId") Long eventId,
            @Param("roundId") Long roundId,
            @Param("boardId") Long boardId,
            @Param("accessStatus") RepositoryAccessStatus accessStatus,
            @Param("q") String q);
}
