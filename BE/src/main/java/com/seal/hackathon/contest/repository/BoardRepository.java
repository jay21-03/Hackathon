package com.seal.hackathon.contest.repository;

import com.seal.hackathon.contest.entity.Board;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardRepository extends JpaRepository<Board, Long> {
	List<Board> findByRoundId(Long roundId);

	Page<Board> findByRoundId(Long roundId, Pageable pageable);

	boolean existsByRoundIdAndBoardOrder(Long roundId, Integer boardOrder);

	boolean existsByRoundIdAndName(Long roundId, String name);

	boolean existsByRoundIdAndBoardOrderAndIdNot(Long roundId, Integer boardOrder, Long id);

	boolean existsByRoundIdAndNameAndIdNot(Long roundId, String name, Long id);
}
