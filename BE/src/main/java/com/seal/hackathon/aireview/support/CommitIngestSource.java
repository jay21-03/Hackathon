package com.seal.hackathon.aireview.support;

/** Aligns with handover team_commits.source (webhook / scheduler). */
public enum CommitIngestSource {
    SCHEDULER("scheduler"),
    WEBHOOK("webhook"),
    MANUAL("manual"),
    BACKFILL("backfill");

    private final String value;

    CommitIngestSource(String value) {
        this.value = value;
    }

    public String value() {
        return value;
    }
}
