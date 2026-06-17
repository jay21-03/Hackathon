package com.seal.hackathon.common.enums;

public enum AiReviewStatus {
    PENDING,
    LLM_STARTED,
    COMPLETED,
    FAILED;

    /** Handover Supabase status: llm_started / done / error */
    public String toHandoverStatus() {
        return switch (this) {
            case COMPLETED -> "done";
            case FAILED -> "error";
            case LLM_STARTED, PENDING -> "llm_started";
        };
    }
}
