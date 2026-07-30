package com.seal.hackathon.demo.repository;

import com.seal.hackathon.demo.entity.DemoSeedRun;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DemoSeedRunRepository extends JpaRepository<DemoSeedRun, String> {
    Optional<DemoSeedRun> findBySeedKey(String seedKey);

    List<DemoSeedRun> findBySeedTypeAndScopeId(String seedType, Long scopeId);
}
