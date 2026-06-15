package com.seal.hackathon.aireview.repository;



import com.seal.hackathon.aireview.entity.RepoCommit;

import java.util.List;

import java.util.Optional;

import org.springframework.data.domain.Pageable;

import org.springframework.data.jpa.repository.JpaRepository;



public interface RepoCommitRepository extends JpaRepository<RepoCommit, Long> {



    Optional<RepoCommit> findTopByTeamRepositoryIdOrderByCommittedAtDescIdDesc(Long teamRepositoryId);



    Optional<RepoCommit> findByTeamRepositoryIdAndCommitSha(Long teamRepositoryId, String commitSha);



    List<RepoCommit> findByTeamRepositoryIdInOrderByCommittedAtDescIdDesc(

            List<Long> teamRepositoryIds, Pageable pageable);

}
