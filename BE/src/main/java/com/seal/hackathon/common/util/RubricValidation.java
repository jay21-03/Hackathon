package com.seal.hackathon.common.util;

import com.seal.hackathon.scoring.dto.CriteriaRequestItem;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.util.StringUtils;

public final class RubricValidation {

    private static final BigDecimal WEIGHT_TARGET = new BigDecimal("100");
    private static final BigDecimal WEIGHT_TOLERANCE = new BigDecimal("0.001");

    private RubricValidation() {}

    public static boolean isWeightSumValid(List<CriteriaRequestItem> criteria) {
        if (criteria == null || criteria.isEmpty()) {
            return true;
        }
        BigDecimal total = BigDecimal.ZERO;
        for (CriteriaRequestItem item : criteria) {
            if (item == null || item.getWeight() == null) {
                return true;
            }
            total = total.add(item.getWeight());
        }
        return total.subtract(WEIGHT_TARGET).abs().compareTo(WEIGHT_TOLERANCE) <= 0;
    }

    public static boolean hasUniqueCodesAndNames(List<CriteriaRequestItem> criteria) {
        if (criteria == null || criteria.isEmpty()) {
            return true;
        }
        Set<String> codes = new HashSet<>();
        Set<String> names = new HashSet<>();
        for (CriteriaRequestItem item : criteria) {
            if (item == null) {
                continue;
            }
            if (StringUtils.hasText(item.getCode()) && !codes.add(item.getCode().trim())) {
                return false;
            }
            if (StringUtils.hasText(item.getName()) && !names.add(item.getName().trim())) {
                return false;
            }
        }
        return true;
    }
}
