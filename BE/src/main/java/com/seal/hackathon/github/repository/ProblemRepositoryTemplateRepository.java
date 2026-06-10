package com.seal.hackathon.github.repository;

import com.seal.hackathon.github.entity.ProblemRepositoryTemplate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProblemRepositoryTemplateRepository extends JpaRepository<ProblemRepositoryTemplate, Long> {
    Optional<ProblemRepositoryTemplate> findByProblemId(Long problemId);

    List<ProblemRepositoryTemplate> findByEnabledTrue();
}
