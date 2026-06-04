import { enablePhase7 } from "./features";

export type NavItem = {
  to: string;
  label: string;
  icon: string;
  group?: string;
  /** Ẩn khỏi sidebar — dùng cho phase 7+ hoặc khi chưa có API */
  hidden?: boolean;
};

/** Mục hiển thị trên sidebar (đã lọc hidden + phase 7 khi tắt cờ) */
export function getVisibleNavItems(items: NavItem[]): NavItem[] {
  return items.filter((item) => {
    if (item.hidden) return false;
    if (!enablePhase7 && isPhase7NavPath(item.to)) return false;
    return true;
  });
}

function isPhase7NavPath(to: string): boolean {
  const phase7Prefixes = [
    "/organizer/rubric",
    "/organizer/check-ins",
    "/organizer/scoring",
    "/organizer/ranking",
    "/organizer/finals",
    "/organizer/disqualifications",
    "/organizer/ai-auditor",
    "/organizer/ai-insights",
    "/organizer/announcements",
    "/organizer/notifications",
    "/organizer/publish-results",
    "/organizer/export-success",
    "/me/check-in",
    "/me/submission",
    "/me/ai-review",
    "/me/results",
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
  { to: "/organizer/users", label: "Người dùng", icon: "manage_accounts", group: "Quản trị" },
  { to: "/organizer/rubric", label: "Tiêu chí chấm", icon: "data_object", group: "Quản trị", hidden: true },
  { to: "/organizer/check-ins", label: "Check-in", icon: "group_add", group: "Vận hành thi", hidden: true },
  { to: "/organizer/scoring", label: "Tiến độ chấm", icon: "gavel", group: "Chấm điểm", hidden: true },
  { to: "/organizer/ai-auditor", label: "Kiểm tra AI", icon: "policy", group: "Chấm điểm", hidden: true },
  { to: "/organizer/ai-insights", label: "Nhận xét AI", icon: "psychology", group: "Chấm điểm", hidden: true },
  { to: "/organizer/ranking", label: "Xếp hạng", icon: "leaderboard", group: "Kết quả", hidden: true },
  { to: "/organizer/finals", label: "Chung kết", icon: "workspace_premium", group: "Kết quả", hidden: true },
  { to: "/organizer/disqualifications", label: "Xử lý vi phạm", icon: "gpp_bad", group: "Kết quả", hidden: true },
  { to: "/organizer/publish-results", label: "Công bố kết quả", icon: "campaign", group: "Kết quả", hidden: true },
  { to: "/organizer/announcements", label: "Thông báo", icon: "notifications", group: "Truyền thông", hidden: true },
  { to: "/organizer/notifications", label: "Trung tâm thông báo", icon: "mark_email_read", group: "Truyền thông", hidden: true },
  { to: "/organizer/export-success", label: "Xuất kết quả", icon: "download", group: "Truyền thông", hidden: true }
];

export const judgeNav: NavItem[] = [
  { to: "/judge/dashboard", label: "Đội được chấm", icon: "assignment", group: "Chấm điểm" },
  { to: "/judge/scoring", label: "Phiếu chấm", icon: "gavel", group: "Chấm điểm", hidden: true }
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
  { to: "/me/submission", label: "Bài nộp", icon: "upload", group: "Thi", hidden: true },
  { to: "/me/ai-review", label: "Đánh giá AI", icon: "psychology", group: "Kết quả", hidden: true },
  { to: "/me/results", label: "Kết quả", icon: "leaderboard", group: "Kết quả", hidden: true }
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
