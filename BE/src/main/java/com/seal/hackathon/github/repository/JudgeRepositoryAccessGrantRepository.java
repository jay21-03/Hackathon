package com.seal.hackathon.github.repository;

import com.seal.hackathon.github.entity.JudgeRepositoryAccessGrant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JudgeRepositoryAccessGrantRepository extends JpaRepository<JudgeRepositoryAccessGrant, Long> {

    boolean existsByTeamRepositoryIdAndJudgeId(Long teamRepositoryId, Long judgeId);

    Optional<JudgeRepositoryAccessGrant> findByTeamRepositoryIdAndJudgeId(Long teamRepositoryId, Long judgeId);

    List<JudgeRepositoryAccessGrant> findByJudgeIdAndTeamRepositoryIdIn(
            Long judgeId, Collection<Long> teamRepositoryIds);
}
