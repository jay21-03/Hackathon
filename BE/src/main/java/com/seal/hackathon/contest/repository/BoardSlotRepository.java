package com.seal.hackathon.contest.repository;

import com.seal.hackathon.contest.entity.BoardSlot;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardSlotRepository extends JpaRepository<BoardSlot, Long> {
	List<BoardSlot> findByBoardId(Long boardId);

	List<BoardSlot> findByRoundId(Long roundId);

	List<BoardSlot> findByTeamId(Long teamId);

	boolean existsByBoardIdAndTeamNumber(Long boardId, Integer teamNumber);

	boolean existsByBoardIdAndTeamNumberAndIdNot(Long boardId, Integer teamNumber, Long id);
}
