/**
 * Cờ tính năng — mặc định BẬT sau khi triển khai đầy đủ.
 * Tắt riêng từng cờ bằng VITE_ENABLE_*=false khi cần thu gọn UI (dev/demo tối giản).
 */
export const enablePhase7 = import.meta.env.VITE_ENABLE_PHASE_7 !== "false";

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

/** Provision repository GitHub theo đề — tắt bằng VITE_ENABLE_GITHUB_PROVISIONING=false */
export const enableGithubProvisioning =
  import.meta.env.VITE_ENABLE_GITHUB_PROVISIONING !== "false";

/** Đánh giá AI repository — tắt bằng VITE_ENABLE_AI_REVIEW=false */
export const enableAiReview = import.meta.env.VITE_ENABLE_AI_REVIEW !== "false";

/** Quản lý học kỳ — tắt bằng VITE_ENABLE_ACADEMIC_TERMS=false */
export const enableAcademicTerms = import.meta.env.VITE_ENABLE_ACADEMIC_TERMS !== "false";

/** Trao giải (hạng mục giải BTC) — tắt bằng VITE_ENABLE_AWARDS=false */
export const enableAwards = import.meta.env.VITE_ENABLE_AWARDS !== "false";

/** Route BTC phase 7+ (không có trong sidebar khi enablePhase7 = false) */
export const organizerRankingPaths = ["ranking", "publish-results", "export-success"] as const;

export const organizerPhase7Paths = ["finals"] as const;

export const participantPhase7Paths = ["submission", "results"] as const;

export const judgePhase7Paths = ["scoring"] as const;
