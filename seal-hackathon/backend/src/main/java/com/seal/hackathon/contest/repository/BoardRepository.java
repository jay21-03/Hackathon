package com.seal.hackathon.contest.repository;

import com.seal.hackathon.contest.entity.Board;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardRepository extends JpaRepository<Board, Long> {
}
