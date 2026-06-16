package com.seal.hackathon.common.util;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.util.StringUtils;

public final class DataIntegrityViolationResolver {

    private DataIntegrityViolationResolver() {
    }

    public static String resolveMessage(DataIntegrityViolationException ex) {
        String message = ex.getMostSpecificCause() != null
                ? ex.getMostSpecificCause().getMessage()
                : ex.getMessage();
        if (!StringUtils.hasText(message)) {
            return "DATA_INTEGRITY_VIOLATION";
        }
        String lower = message.toLowerCase();
        if (containsAny(lower, "ux_teams_event_lower_name", "teams_event_lower_name")) {
            return "TEAM_NAME_DUPLICATE";
        }
        if (containsAny(lower, "ux_team_members_event_email", "team_members_event_email")) {
            return "MEMBER_EMAIL_DUPLICATE";
        }
        if (containsAny(lower, "users_email", "uq_users_email", "users(email)")) {
            return "EMAIL_DUPLICATE";
        }
        if (containsAny(lower, "award_categories", "uq_award")) {
            return "AWARD_CATEGORY_DUPLICATE";
        }
        if (containsAny(lower, "github_username", "uq_users_github_username")) {
            return "GITHUB_USERNAME_DUPLICATE";
        }
        return "DATA_INTEGRITY_VIOLATION";
    }

    private static boolean containsAny(String haystack, String... needles) {
        for (String needle : needles) {
            if (haystack.contains(needle)) {
                return true;
            }
        }
        return false;
    }
}
