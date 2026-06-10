package com.seal.hackathon.support;

import com.seal.hackathon.academic.entity.AcademicTerm;
import com.seal.hackathon.academic.repository.AcademicTermRepository;
import com.seal.hackathon.common.enums.AcademicTermStatus;
import com.seal.hackathon.common.enums.AcademicTermType;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public final class IntegrationTestFixtures {

    private IntegrationTestFixtures() {
    }

    public static Long defaultAcademicTermId(AcademicTermRepository academicTermRepository) {
        return academicTermRepository.findByCode("SPRING_2026")
                .map(AcademicTerm::getId)
                .orElseGet(() -> {
                    OffsetDateTime now = OffsetDateTime.now();
                    return academicTermRepository.save(AcademicTerm.builder()
                                    .code("SPRING_2026")
                                    .name("Spring 2026")
                                    .year(2026)
                                    .termType(AcademicTermType.SPRING)
                                    .startDate(LocalDate.of(2026, 1, 1))
                                    .endDate(LocalDate.of(2026, 5, 31))
                                    .status(AcademicTermStatus.ACTIVE)
                                    .createdAt(now)
                                    .updatedAt(now)
                                    .build())
                            .getId();
                });
    }
}
