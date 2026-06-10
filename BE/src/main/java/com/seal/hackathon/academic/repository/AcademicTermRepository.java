package com.seal.hackathon.academic.repository;

import com.seal.hackathon.academic.entity.AcademicTerm;
import com.seal.hackathon.common.enums.AcademicTermStatus;
import com.seal.hackathon.common.enums.AcademicTermType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AcademicTermRepository extends JpaRepository<AcademicTerm, Long> {

    Optional<AcademicTerm> findByCode(String code);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);

    boolean existsByYearAndTermType(Integer year, AcademicTermType termType);

    boolean existsByYearAndTermTypeAndIdNot(Integer year, AcademicTermType termType, Long id);

    List<AcademicTerm> findByStatusOrderByYearDescTermTypeAsc(AcademicTermStatus status);

    List<AcademicTerm> findAllByOrderByYearDescTermTypeAsc();

    @Query("SELECT COUNT(e) FROM Event e WHERE e.academicTermId = :termId")
    long countEventsByTermId(@Param("termId") Long termId);
}
