package com.seal.hackathon.scoring.repository;

import com.seal.hackathon.scoring.entity.CriteriaTemplateItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CriteriaTemplateItemRepository extends JpaRepository<CriteriaTemplateItem, Long> {

    List<CriteriaTemplateItem> findByTemplateIdOrderBySortOrderAsc(Long templateId);

    void deleteByTemplateId(Long templateId);
}
