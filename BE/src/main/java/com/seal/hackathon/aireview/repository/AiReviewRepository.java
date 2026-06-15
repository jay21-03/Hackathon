package com.seal.hackathon.aireview.repository;

import com.seal.hackathon.aireview.entity.AiReview;
import com.seal.hackathon.common.enums.AiReviewKind;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

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
}
