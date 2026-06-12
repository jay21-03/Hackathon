package com.seal.hackathon.scoring.repository;

import com.seal.hackathon.scoring.entity.CriteriaTemplate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CriteriaTemplateRepository extends JpaRepository<CriteriaTemplate, Long> {

    List<CriteriaTemplate> findAllByOrderBySystemDefaultDescNameAsc();

    Optional<CriteriaTemplate> findBySystemDefaultTrue();
}
