package com.seal.hackathon.aireview.repository;

import com.seal.hackathon.aireview.entity.RepoCommit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RepoCommitRepository extends JpaRepository<RepoCommit, Long> {
}
