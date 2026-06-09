package com.seal.hackathon.mail.enums;

public enum EmailTemplateKey {
    STAFF_INVITATION,
    TEAM_INVITATION,
    STAFF_REMINDER,
    TEAM_REMINDER;

    public String classpathName() {
        return switch (this) {
            case STAFF_INVITATION -> "mail/staff-invitation";
            case TEAM_INVITATION -> "mail/team-invitation";
            case STAFF_REMINDER -> "mail/staff-reminder";
            case TEAM_REMINDER -> "mail/team-reminder";
        };
    }
}
