package com.seal.hackathon.github.util;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.util.StringUtils;

public final class GitHubRepositoryNameSlug {

    private static final int MAX_REPO_NAME_LENGTH = 100;

    private GitHubRepositoryNameSlug() {
    }

    public static String build(String eventName, String teamName, String problemTitle) {
        List<String> segments = new ArrayList<>(3);
        addSegment(segments, eventName, "event");
        addSegment(segments, teamName, "team");
        addSegment(segments, problemTitle, "problem");
        return trimToMaxLength(String.join("-", segments), MAX_REPO_NAME_LENGTH);
    }

    static String slugSegment(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        String preprocessed = value.trim()
                .replace('đ', 'd')
                .replace('Đ', 'D');
        String normalized = Normalizer.normalize(preprocessed, Normalizer.Form.NFD);
        String ascii = normalized.replaceAll("\\p{M}+", "");
        return ascii.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("-{2,}", "-")
                .replaceAll("^-+|-+$", "");
    }

    private static void addSegment(List<String> segments, String value, String fallback) {
        String slug = slugSegment(value);
        segments.add(StringUtils.hasText(slug) ? slug : fallback);
    }

    private static String trimToMaxLength(String value, int maxLength) {
        if (value.length() <= maxLength) {
            return value;
        }
        String trimmed = value.substring(0, maxLength).replaceAll("-+$", "");
        return StringUtils.hasText(trimmed) ? trimmed : value.substring(0, maxLength);
    }
}
