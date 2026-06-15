import {
  enableAcademicTerms,
  enableAiReview,
  enableAnnouncements,
  enableGithubProvisioning,
  enableNotifications,
  enablePhase7,
  enableRanking,
  enableScoring,
  enableSubmissions
} from "./features";

export type NavItem = {
  to: string;
  label: string;
  icon: string;
  group?: string;
  /** Ẩn khỏi sidebar — dùng cho phase 7+ hoặc khi chưa có API */
  hidden?: boolean;
};

const notificationNavPrefixes = ["/me/notifications", "/organizer/notifications", "/judge/notifications"];
const scoringNavPrefixes = [
  "/organizer/results-hub",
  "/organizer/rubric",
  "/organizer/scoring",
  "/judge/scoring"
];
const submissionNavPrefixes = ["/me/submission", "/organizer/submissions"];
const artifactsNavPrefixes = [
  "/organizer/artifacts-hub",
  "/organizer/submissions",
  "/organizer/repositories"
];
const rankingNavPrefixes = [
  "/organizer/results-hub",
  "/organizer/ranking",
  "/organizer/publish-results",
  "/organizer/export-success",
  "/organizer/finals",
  "/organizer/awards",
  "/events/",
  "/me/results"
];

function isScoringNavPath(to: string): boolean {
  return scoringNavPrefixes.some((prefix) => to === prefix || to.startsWith(`${prefix}/`));
}

function isArtifactsNavPath(to: string): boolean {
  return artifactsNavPrefixes.some((prefix) => to === prefix || to.startsWith(`${prefix}/`));
}

/** Mục hiển thị trên sidebar (đã lọc hidden + phase 7 khi tắt cờ) */
export function getVisibleNavItems(items: NavItem[]): NavItem[] {
  return items.filter((item) => {
    if (item.hidden) return false;
    if (isScoringNavPath(item.to)) return enableScoring;
    if (isArtifactsNavPath(item.to)) return enableSubmissions || enableGithubProvisioning;
    if (isSubmissionNavPath(item.to)) return enableSubmissions;
    if (isRankingNavPath(item.to)) return enableRanking;
    if (isNotificationNavPath(item.to)) return enableNotifications;
    if (item.to === "/organizer/announcements") return enableAnnouncements;
    if (!enablePhase7 && isPhase7NavPath(item.to)) return false;
    return true;
  });
}

function isSubmissionNavPath(to: string): boolean {
  return submissionNavPrefixes.some((prefix) => to === prefix || to.startsWith(`${prefix}/`));
}

function isRankingNavPath(to: string): boolean {
  return rankingNavPrefixes.some((prefix) => to === prefix || to.startsWith(prefix));
}

function isNotificationNavPath(to: string): boolean {
  return notificationNavPrefixes.some((prefix) => to === prefix || to.startsWith(`${prefix}/`));
}

export function isNotificationsNavItem(to: string): boolean {
  return isNotificationNavPath(to);
}

function isPhase7NavPath(to: string): boolean {
  const phase7Prefixes = ["/organizer/finals", "/organizer/announcements"];
  return phase7Prefixes.some((prefix) => to === prefix || to.startsWith(`${prefix}/`));
}

/**
 * Sidebar BTC — thứ tự khớp quy trình thiết lập:
 * Cuộc thi → Đăng ký → Mời thành viên → Bảng → Đề → Phân công
 */
export const organizerNav: NavItem[] = [
  { to: "/organizer/dashboard", label: "Tổng quan", icon: "dashboard", group: "Tổng quan" },
  {
    to: "/organizer/academic-terms",
    label: "Học kỳ",
    icon: "calendar_month",
    group: "Thiết lập",
    hidden: !enableAcademicTerms
  },
  { to: "/organizer/events", label: "Cuộc thi", icon: "event", group: "Thiết lập" },
  { to: "/organizer/events/new", label: "Tạo cuộc thi", icon: "add_circle", group: "Thiết lập" },
  { to: "/organizer/boards", label: "Bảng thi", icon: "grid_view", group: "Thiết lập" },
  { to: "/organizer/teams-hub", label: "Đội & lời mời", icon: "groups", group: "Thiết lập" },
  { to: "/organizer/board-ops", label: "Vận hành bảng", icon: "tune", group: "Vận hành thi" },
  {
    to: "/organizer/artifacts-hub",
    label: "Bài nộp & repo",
    icon: "upload_file",
    group: "Vận hành thi",
    hidden: !enableSubmissions && !enableGithubProvisioning
  },
  { to: "/organizer/results-hub", label: "Kết quả", icon: "leaderboard", group: "Chấm & kết quả" },
  { to: "/organizer/users", label: "Người dùng", icon: "manage_accounts", group: "Quản trị" },
  { to: "/organizer/announcements", label: "Thông báo chung", icon: "notifications_active", group: "Truyền thông" },
  { to: "/organizer/notifications", label: "Trung tâm thông báo", icon: "mark_email_read", group: "Truyền thông" }
];

export const judgeNav: NavItem[] = [
  { to: "/judge/dashboard", label: "Đội được chấm", icon: "assignment", group: "Chấm điểm" },
  { to: "/judge/scoring", label: "Phiếu chấm", icon: "gavel", group: "Chấm điểm" },
  { to: "/judge/ai-review", label: "Đánh giá AI", icon: "psychology", group: "Chấm điểm", hidden: !enableAiReview },
  { to: "/judge/notifications", label: "Thông báo", icon: "notifications", group: "Tài khoản" },
  { to: "/judge/profile", label: "Hồ sơ", icon: "person", group: "Tài khoản" }
];

export const mentorNav: NavItem[] = [
  { to: "/mentor/dashboard", label: "Đội phụ trách", icon: "groups", group: "Theo dõi" },
  { to: "/mentor/ai-review", label: "Đánh giá AI", icon: "psychology", group: "Theo dõi", hidden: !enableAiReview },
  { to: "/mentor/profile", label: "Hồ sơ", icon: "person", group: "Tài khoản" }
];

/** Không gian thi — một sidebar thống nhất (kể cả /events, /profile) */
export const participantWorkspaceNav: NavItem[] = [
  { to: "/me", label: "Tổng quan", icon: "dashboard", group: "Tổng quan" },
  { to: "/me/team", label: "Đội của tôi", icon: "groups", group: "Đội" },
  { to: "/me/board", label: "Bảng thi", icon: "grid_view", group: "Thi" },
  { to: "/me/problem", label: "Đề thi", icon: "code", group: "Thi" },
  { to: "/me/submission", label: "Bài nộp", icon: "upload", group: "Thi" },
  { to: "/me/ai-review", label: "Đánh giá AI", icon: "psychology", group: "Tham khảo", hidden: !enableAiReview },
  { to: "/me/results", label: "Kết quả", icon: "leaderboard", group: "Kết quả" },
  { to: "/profile", label: "Hồ sơ", icon: "person", group: "Tài khoản" },
  { to: "/me/notifications", label: "Thông báo", icon: "notifications", group: "Tài khoản" }
];

/** NavLink `end`: mục cha chỉ active đúng route (vd. /me, /events, /organizer/events/*). */
export function navItemUsesEnd(item: NavItem, pathname: string): boolean {
  if (item.to === "/me") return pathname === "/me";
  if (item.to === "/events") return pathname === "/events";
  if (item.to === "/organizer/dashboard") return pathname === "/organizer/dashboard";
  if (item.to === "/organizer/events") {
    return pathname.startsWith("/organizer/events") && pathname !== "/organizer/events/new";
  }
  if (item.to === "/organizer/events/new") return pathname === "/organizer/events/new";
  if (item.to === "/judge/dashboard") return pathname === "/judge/dashboard";
  if (item.to === "/mentor/dashboard") return pathname === "/mentor/dashboard";
  return false;
}
