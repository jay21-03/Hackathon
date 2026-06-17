package com.seal.hackathon.aireview.support;

import java.util.List;

public class AiReviewValidationException extends RuntimeException {

    private final List<String> violations;

    public AiReviewValidationException(List<String> violations) {
        super(formatMessage(violations));
        this.violations = List.copyOf(violations);
    }

    public List<String> violations() {
        return violations;
    }

    private static String formatMessage(List<String> violations) {
        if (violations == null || violations.isEmpty()) {
            return "AI review output validation failed";
        }
        return "AI review output validation failed: " + String.join("; ", violations);
    }
}
