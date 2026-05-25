package com.seal.hackathon.aireview.repository;

import com.seal.hackathon.aireview.entity.AiReview;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiReviewRepository extends JpaRepository<AiReview, Long> {
	List<AiReview> findByTeamId(Long teamId);
}
