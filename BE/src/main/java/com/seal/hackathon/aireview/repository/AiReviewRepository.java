package com.seal.hackathon.aireview.repository;

import com.seal.hackathon.aireview.entity.AiReview;
import com.seal.hackathon.common.enums.AiReviewKind;
import com.seal.hackathon.common.enums.AiReviewStatus;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AiReviewRepository extends JpaRepository<AiReview, Long> {

    List<AiReview> findByTeamIdOrderByReviewedAtDescCreatedAtDesc(Long teamId);

    Optional<AiReview> findFirstByTeamIdOrderByReviewedAtDescCreatedAtDesc(Long teamId);

    Optional<AiReview> findFirstByTeamIdAndReviewKindOrderByReviewedAtDescCreatedAtDesc(
            Long teamId, AiReviewKind reviewKind);

    List<AiReview> findByTeamIdAndReviewKindOrderByReviewedAtDescCreatedAtDesc(
            Long teamId, AiReviewKind reviewKind, Pageable pageable);

    List<AiReview> findByTeamIdInOrderByReviewedAtDescCreatedAtDesc(List<Long> teamIds);

    List<AiReview> findByTeamIdInAndReviewKindOrderByReviewedAtDescCreatedAtDesc(
            List<Long> teamIds, AiReviewKind reviewKind);

    Optional<AiReview> findByTeamIdAndCommitShaAndReviewKind(
            Long teamId, String commitSha, AiReviewKind reviewKind);

    Optional<AiReview> findByTeamRepositoryIdAndCommitShaAndReviewKind(
            Long teamRepositoryId, String commitSha, AiReviewKind reviewKind);

    List<AiReview> findByTeamIdInAndStatusOrderByReviewedAtDesc(
            List<Long> teamIds, AiReviewStatus status);

    long countByTeamIdInAndStatus(List<Long> teamIds, AiReviewStatus status);

    Optional<AiReview> findFirstByTeamIdInAndStatusOrderByReviewedAtAsc(
            List<Long> teamIds, AiReviewStatus status);

    @Query("SELECT DISTINCT a.teamId FROM AiReview a WHERE a.status = :status")
    List<Long> findDistinctTeamIdsByStatus(@Param("status") AiReviewStatus status);
}
