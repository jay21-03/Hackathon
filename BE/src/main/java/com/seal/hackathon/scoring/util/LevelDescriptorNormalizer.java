package com.seal.hackathon.scoring.util;

import com.seal.hackathon.scoring.dto.LevelDescriptorDto;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.util.StringUtils;

public final class LevelDescriptorNormalizer {

    private static final Set<String> VALID_LEVELS =
            Set.of("EXCELLENT", "GOOD", "SATISFACTORY", "UNSATISFACTORY");

    private LevelDescriptorNormalizer() {}

    public static List<LevelDescriptorDto> normalize(List<LevelDescriptorDto> input) {
        List<LevelDescriptorDto> defaults = defaultDescriptors();
        if (input == null || input.isEmpty()) {
            return defaults;
        }
        List<LevelDescriptorDto> result = new ArrayList<>(4);
        for (int i = 0; i < 4; i++) {
            LevelDescriptorDto fallback = defaults.get(i);
            LevelDescriptorDto source = i < input.size() ? input.get(i) : null;
            result.add(mergeDescriptor(fallback, source));
        }
        return result;
    }

    private static LevelDescriptorDto mergeDescriptor(LevelDescriptorDto fallback, LevelDescriptorDto source) {
        if (source == null) {
            return copy(fallback);
        }
        String level = normalizeLevelToken(source.getLevel(), fallback.getLevel());
        String label = StringUtils.hasText(source.getLabel()) ? source.getLabel().trim() : fallback.getLabel();
        BigDecimal minScore = source.getMinScore() != null ? source.getMinScore() : fallback.getMinScore();
        BigDecimal maxScore = source.getMaxScore() != null ? source.getMaxScore() : fallback.getMaxScore();
        String description = StringUtils.hasText(source.getDescription())
                ? source.getDescription().trim()
                : fallback.getDescription();
        return LevelDescriptorDto.builder()
                .level(level)
                .label(label)
                .minScore(minScore)
                .maxScore(maxScore)
                .description(description)
                .build();
    }

    private static String normalizeLevelToken(String raw, String fallback) {
        if (!StringUtils.hasText(raw)) {
            return fallback;
        }
        String trimmed = raw.trim();
        if (VALID_LEVELS.contains(trimmed.toUpperCase(Locale.ROOT))) {
            return trimmed.toUpperCase(Locale.ROOT);
        }
        return switch (trimmed) {
            case "1", "4" -> "EXCELLENT";
            case "2" -> "GOOD";
            case "3" -> "SATISFACTORY";
            default -> fallback;
        };
    }

    private static List<LevelDescriptorDto> defaultDescriptors() {
        return List.of(
                descriptor(
                        "EXCELLENT",
                        "Xuất sắc",
                        "9",
                        "10",
                        "Vượt mong đợi so với yêu cầu của tiêu chí."),
                descriptor(
                        "GOOD",
                        "Tốt",
                        "7",
                        "8.9",
                        "Đáp ứng tốt hầu hết yêu cầu, chỉ còn điểm cần cải thiện nhỏ."),
                descriptor(
                        "SATISFACTORY",
                        "Đạt",
                        "5",
                        "6.9",
                        "Đáp ứng một phần yêu cầu, còn thiếu sót rõ ràng."),
                descriptor(
                        "UNSATISFACTORY",
                        "Chưa đạt",
                        "0",
                        "4.9",
                        "Chưa đáp ứng yêu cầu tối thiểu của tiêu chí."));
    }

    private static LevelDescriptorDto descriptor(
            String level, String label, String min, String max, String description) {
        return LevelDescriptorDto.builder()
                .level(level)
                .label(label)
                .minScore(new BigDecimal(min))
                .maxScore(new BigDecimal(max))
                .description(description)
                .build();
    }

    private static LevelDescriptorDto copy(LevelDescriptorDto source) {
        return LevelDescriptorDto.builder()
                .level(source.getLevel())
                .label(source.getLabel())
                .minScore(source.getMinScore())
                .maxScore(source.getMaxScore())
                .description(source.getDescription())
                .build();
    }
}
