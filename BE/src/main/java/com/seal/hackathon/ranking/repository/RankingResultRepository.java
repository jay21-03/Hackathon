package com.seal.hackathon.ranking.repository;

import com.seal.hackathon.ranking.entity.RankingResult;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RankingResultRepository extends JpaRepository<RankingResult, Long> {

    List<RankingResult> findByBoardIdOrderByRankAsc(Long boardId);

    List<RankingResult> findByRoundIdOrderByBoardIdAscRankAsc(Long roundId);

    List<RankingResult> findByRoundIdAndPublishedAtIsNotNullOrderByBoardIdAscRankAsc(Long roundId);

    List<RankingResult> findByTeamIdAndPublishedAtIsNotNullOrderByBoardIdAscRankAsc(Long teamId);

    List<RankingResult> findByTeamId(Long teamId);

    void deleteByBoardId(Long boardId);

    void deleteByTeamId(Long teamId);

    boolean existsByBoardId(Long boardId);

    boolean existsByBoardIdAndPublishedAtIsNotNull(Long boardId);
}
