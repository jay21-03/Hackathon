package com.seal.hackathon.award.repository;

import com.seal.hackathon.award.entity.AwardCategory;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AwardCategoryRepository extends JpaRepository<AwardCategory, Long> {

    List<AwardCategory> findByEventIdOrderBySortOrderAscIdAsc(Long eventId);

    List<AwardCategory> findByEventIdAndIsActiveTrueOrderBySortOrderAscIdAsc(Long eventId);

    Optional<AwardCategory> findByIdAndEventId(Long id, Long eventId);

    boolean existsByEventIdAndCode(Long eventId, String code);

    boolean existsByEventIdAndCodeAndIdNot(Long eventId, String code, Long id);
}
