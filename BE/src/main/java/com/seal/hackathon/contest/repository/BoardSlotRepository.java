package com.seal.hackathon.contest.repository;

import com.seal.hackathon.contest.entity.BoardSlot;
import java.util.Collection;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardSlotRepository extends JpaRepository<BoardSlot, Long> {
	List<BoardSlot> findByBoardId(Long boardId);

	List<BoardSlot> findByBoardIdOrderByTeamNumberAsc(Long boardId);

	List<BoardSlot> findByRoundId(Long roundId);

	List<BoardSlot> findByTeamId(Long teamId);

	boolean existsByBoardIdAndTeamNumber(Long boardId, Integer teamNumber);

	boolean existsByBoardIdAndTeamNumberAndIdNot(Long boardId, Integer teamNumber, Long id);

	Page<BoardSlot> findByBoardIdAndTeamIdIsNotNullOrderByTeamNumberAsc(Long boardId, Pageable pageable);

	Page<BoardSlot> findByRoundIdInAndTeamIdIsNotNullOrderByTeamNumberAsc(
			Collection<Long> roundIds, Pageable pageable);
}
