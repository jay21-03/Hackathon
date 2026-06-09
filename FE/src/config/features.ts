/**
 * Cờ tính năng — phase 9+ (check-in, AI…) mặc định TẮT qua VITE_ENABLE_PHASE_7.
 * Scoring, submissions, ranking mặc định BẬT — tắt riêng từng cờ nếu cần.
 */
export const enablePhase7 = import.meta.env.VITE_ENABLE_PHASE_7 === "true";

/** Rubric + chấm điểm + tiến độ — tắt bằng VITE_ENABLE_SCORING=false */
export const enableScoring = import.meta.env.VITE_ENABLE_SCORING !== "false";

/** Bài nộp (repository link) — tắt bằng VITE_ENABLE_SUBMISSIONS=false */
export const enableSubmissions = import.meta.env.VITE_ENABLE_SUBMISSIONS !== "false";

/** Xếp hạng & công bố kết quả (phase 8) — tắt bằng VITE_ENABLE_RANKING=false */
export const enableRanking = import.meta.env.VITE_ENABLE_RANKING !== "false";

/** Thông báo in-app (phase 9) — tắt bằng VITE_ENABLE_NOTIFICATIONS=false */
export const enableNotifications = import.meta.env.VITE_ENABLE_NOTIFICATIONS !== "false";

/** Thông báo chung BTC → participant/mentor/judge — tắt bằng VITE_ENABLE_ANNOUNCEMENTS=false */
export const enableAnnouncements = import.meta.env.VITE_ENABLE_ANNOUNCEMENTS !== "false";

/** Lời mời mentor/GK — tắt bằng VITE_ENABLE_STAFF_INVITATIONS=false */
export const enableStaffInvitations = import.meta.env.VITE_ENABLE_STAFF_INVITATIONS !== "false";

/** Route BTC phase 7+ (không có trong sidebar khi enablePhase7 = false) */
export const organizerRankingPaths = ["ranking", "publish-results", "export-success"] as const;

export const organizerPhase7Paths = [
  "check-ins",
  "finals",
  "ai-auditor",
  "ai-insights"
] as const;

export const participantPhase7Paths = ["check-in", "submission", "ai-review", "results"] as const;

export const judgePhase7Paths = ["scoring"] as const;

export const mentorPhase7Paths = ["ai-review"] as const;
