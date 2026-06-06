import { enableAnnouncements, enableNotifications, enablePhase7, enableRanking, enableScoring, enableSubmissions } from "./features";

export type NavItem = {
  to: string;
  label: string;
  icon: string;
  group?: string;
  /** Ẩn khỏi sidebar — dùng cho phase 7+ hoặc khi chưa có API */
  hidden?: boolean;
};

const notificationNavPrefixes = ["/me/notifications", "/organizer/notifications"];
const scoringNavPrefixes = ["/organizer/rubric", "/organizer/scoring", "/judge/scoring"];
const submissionNavPrefixes = ["/me/submission", "/organizer/submissions"];
const rankingNavPrefixes = [
  "/organizer/ranking",
  "/organizer/publish-results",
  "/organizer/export-success",
  "/events/",
  "/me/results"
];

function isScoringNavPath(to: string): boolean {
  return scoringNavPrefixes.some((prefix) => to === prefix || to.startsWith(`${prefix}/`));
}

/** Mục hiển thị trên sidebar (đã lọc hidden + phase 7 khi tắt cờ) */
export function getVisibleNavItems(items: NavItem[]): NavItem[] {
  return items.filter((item) => {
    if (item.hidden) return false;
    if (isScoringNavPath(item.to)) return enableScoring;
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
  const phase7Prefixes = [
    "/organizer/check-ins",
    "/organizer/finals",
    "/organizer/disqualifications",
    "/organizer/ai-auditor",
    "/organizer/ai-insights",
    "/organizer/announcements",
    "/me/check-in",
    "/me/ai-review",
    "/judge/scoring",
    "/mentor/ai-review"
  ];
  return phase7Prefixes.some((prefix) => to === prefix || to.startsWith(`${prefix}/`));
}

/** Sidebar trang chủ thí sinh — chọn cuộc thi trước khi vào không gian thi */
export const participantHubNav: NavItem[] = [
  { to: "/events", label: "Danh sách các cuộc thi", icon: "event", group: "Trang chủ" },
  { to: "/profile", label: "Hồ sơ", icon: "person", group: "Tài khoản" }
];

/**
 * Sidebar BTC — thứ tự khớp quy trình thiết lập:
 * Cuộc thi → Đăng ký → Lời mời → Bảng → Đề → Phân công
 */
export const organizerNav: NavItem[] = [
  { to: "/organizer/dashboard", label: "Tổng quan", icon: "dashboard", group: "Tổng quan" },
  { to: "/organizer/events", label: "Cuộc thi", icon: "event", group: "Thiết lập" },
  { to: "/organizer/registrations", label: "Đăng ký đội", icon: "fact_check", group: "Thiết lập" },
  { to: "/organizer/invitations", label: "Lời mời thành viên", icon: "mail", group: "Thiết lập" },
  { to: "/organizer/boards", label: "Bảng thi", icon: "grid_view", group: "Vận hành thi" },
  { to: "/organizer/problems", label: "Đề thi", icon: "code_blocks", group: "Vận hành thi" },
  { to: "/organizer/assignments", label: "Mentor & giám khảo", icon: "supervisor_account", group: "Vận hành thi" },
  { to: "/organizer/rubric", label: "Tiêu chí chấm", icon: "data_object", group: "Chấm điểm" },
  { to: "/organizer/scoring", label: "Tiến độ chấm", icon: "gavel", group: "Chấm điểm" },
  { to: "/organizer/submissions", label: "Bài nộp đội", icon: "upload_file", group: "Chấm điểm" },
  { to: "/organizer/ranking", label: "Xếp hạng", icon: "leaderboard", group: "Kết quả" },
  { to: "/organizer/publish-results", label: "Công bố kết quả", icon: "campaign", group: "Kết quả" },
  { to: "/organizer/export-success", label: "Xuất kết quả", icon: "download", group: "Kết quả" },
  { to: "/organizer/users", label: "Người dùng", icon: "manage_accounts", group: "Quản trị" },
  { to: "/organizer/check-ins", label: "Check-in", icon: "group_add", group: "Vận hành thi", hidden: true },
  { to: "/organizer/ai-auditor", label: "Kiểm tra AI", icon: "policy", group: "Chấm điểm", hidden: true },
  { to: "/organizer/ai-insights", label: "Nhận xét AI", icon: "psychology", group: "Chấm điểm", hidden: true },
  { to: "/organizer/finals", label: "Chung kết", icon: "workspace_premium", group: "Kết quả", hidden: true },
  { to: "/organizer/disqualifications", label: "Xử lý vi phạm", icon: "gpp_bad", group: "Kết quả", hidden: true },
  { to: "/organizer/announcements", label: "Thông báo chung", icon: "campaign", group: "Truyền thông" },
  { to: "/organizer/notifications", label: "Trung tâm thông báo", icon: "mark_email_read", group: "Truyền thông" }
];

export const judgeNav: NavItem[] = [
  { to: "/judge/dashboard", label: "Đội được chấm", icon: "assignment", group: "Chấm điểm" },
  { to: "/judge/scoring", label: "Phiếu chấm", icon: "gavel", group: "Chấm điểm" }
];

export const mentorNav: NavItem[] = [
  { to: "/mentor/dashboard", label: "Đội phụ trách", icon: "groups", group: "Theo dõi" },
  { to: "/mentor/ai-review", label: "Đánh giá AI", icon: "psychology", group: "Theo dõi", hidden: true }
];

/** Không gian thi — thứ tự: tổng quan → đội → bảng → đề */
export const participantWorkspaceNav: NavItem[] = [
  { to: "/me", label: "Tổng quan", icon: "dashboard", group: "Tổng quan" },
  { to: "/me/team", label: "Đội của tôi", icon: "groups", group: "Đội" },
  { to: "/me/board", label: "Bảng thi", icon: "grid_view", group: "Thi" },
  { to: "/me/problem", label: "Đề thi", icon: "code", group: "Thi" },
  { to: "/profile", label: "Hồ sơ", icon: "person", group: "Tài khoản" },
  { to: "/me/check-in", label: "Check-in", icon: "how_to_reg", group: "Thi", hidden: true },
  { to: "/me/submission", label: "Bài nộp", icon: "upload", group: "Thi" },
  { to: "/me/ai-review", label: "Đánh giá AI", icon: "psychology", group: "Kết quả", hidden: true },
  { to: "/me/results", label: "Kết quả", icon: "leaderboard", group: "Kết quả" },
  { to: "/me/notifications", label: "Thông báo", icon: "notifications", group: "Tài khoản" }
];

/** NavLink `end`: mục cha chỉ active đúng route (vd. /me, /events, /organizer/events/*). */
export function navItemUsesEnd(item: NavItem, pathname: string): boolean {
  if (item.to === "/me") return pathname === "/me";
  if (item.to === "/events") return pathname === "/events";
  if (item.to === "/organizer/dashboard") return pathname === "/organizer/dashboard";
  if (item.to === "/organizer/events") return pathname.startsWith("/organizer/events");
  if (item.to === "/judge/dashboard") return pathname === "/judge/dashboard";
  if (item.to === "/mentor/dashboard") return pathname === "/mentor/dashboard";
  return false;
}
