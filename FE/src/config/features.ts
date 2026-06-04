/**
 * Cờ tính năng — mặc định TẮT để không hiện menu/route placeholder.
 * Bật khi BE sẵn sàng: VITE_ENABLE_PHASE_7=true, VITE_ENABLE_STAFF_INVITATIONS=true
 */
export const enablePhase7 = import.meta.env.VITE_ENABLE_PHASE_7 === "true";

export const enableStaffInvitations = import.meta.env.VITE_ENABLE_STAFF_INVITATIONS === "true";

/** Route BTC phase 7+ (không có trong sidebar khi enablePhase7 = false) */
export const organizerPhase7Paths = [
  "rubric",
  "check-ins",
  "scoring",
  "ranking",
  "finals",
  "disqualifications",
  "ai-auditor",
  "ai-insights",
  "announcements",
  "notifications",
  "publish-results",
  "export-success"
] as const;

export const participantPhase7Paths = ["check-in", "submission", "ai-review", "results"] as const;

export const judgePhase7Paths = ["scoring"] as const;

export const mentorPhase7Paths = ["ai-review"] as const;
