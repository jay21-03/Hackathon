package com.seal.hackathon.demo;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class DemoSeedDataFactory {
    private DemoSeedDataFactory() {}

    public static BigDecimal deterministicScore(
            Long eventId, Long roundId, Long boardId, Long teamId, Long judgeId, Long criteriaId) {
        long hash = 17;
        hash = 31 * hash + value(eventId);
        hash = 31 * hash + value(roundId);
        hash = 31 * hash + value(boardId);
        hash = 31 * hash + value(teamId);
        hash = 31 * hash + value(judgeId);
        hash = 31 * hash + value(criteriaId);
        int bucket = (int) Math.floorMod(hash, 26);
        return BigDecimal.valueOf(6.5 + bucket / 10.0).setScale(2, RoundingMode.HALF_UP);
    }

    public static String demoSha(String prefix, Long... ids) {
        StringBuilder raw = new StringBuilder(prefix);
        for (Long id : ids) {
            raw.append("-").append(id == null ? 0 : id);
        }
        return Integer.toHexString(raw.toString().hashCode()).repeat(8).substring(0, 40);
    }

    private static long value(Long value) {
        return value == null ? 0L : value;
    }
}
