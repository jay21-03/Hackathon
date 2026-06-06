package com.seal.hackathon.scoring.repository;

import com.seal.hackathon.scoring.entity.ScoreItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScoreItemRepository extends JpaRepository<ScoreItem, Long> {
    List<ScoreItem> findByScoreSheetId(Long scoreSheetId);

    void deleteByScoreSheetId(Long scoreSheetId);

    void deleteByCriteriaId(Long criteriaId);
}
