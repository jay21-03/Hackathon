export type NavItem = {
  to: string;
  label: string;
  icon: string;
  group?: string;
  hidden?: boolean;
};

export const organizerNav: NavItem[] = [
  { to: "/organizer/dashboard", label: "Tổng quan", icon: "dashboard", group: "Tổng quan" },
  { to: "/organizer/events", label: "Cuộc thi", icon: "event", group: "Thiết lập" },
  { to: "/organizer/registrations", label: "Đăng ký đội", icon: "fact_check", group: "Đăng ký và phân công" },
  { to: "/organizer/boards", label: "Bảng chấm", icon: "grid_view", group: "Đăng ký và phân công" },
  { to: "/organizer/assignments", label: "Mentor và giám khảo", icon: "supervisor_account", group: "Đăng ký và phân công" },
  { to: "/organizer/users", label: "Người dùng", icon: "manage_accounts", group: "Quản trị" },
  { to: "/organizer/problems", label: "Đề thi", icon: "code_blocks", group: "Thiết lập" },
  { to: "/organizer/rubric", label: "Tiêu chí chấm", icon: "data_object", group: "Thiết lập", hidden: true },
  { to: "/organizer/invitations", label: "Lời mời", icon: "mail", group: "Đăng ký và phân công" },
  { to: "/organizer/check-ins", label: "Check-in", icon: "group_add", group: "Vận hành ngày thi", hidden: true },
  { to: "/organizer/scoring", label: "Tiến độ chấm", icon: "gavel", group: "Chấm điểm", hidden: true },
  { to: "/organizer/ai-auditor", label: "Kiểm tra AI", icon: "policy", group: "Chấm điểm", hidden: true },
  { to: "/organizer/ai-insights", label: "Nhận xét AI", icon: "psychology", group: "Chấm điểm", hidden: true },
  { to: "/organizer/ranking", label: "Xếp hạng", icon: "leaderboard", group: "Kết quả", hidden: true },
  { to: "/organizer/finals", label: "Chung kết", icon: "workspace_premium", group: "Kết quả", hidden: true },
  { to: "/organizer/disqualifications", label: "Xử lý vi phạm", icon: "gpp_bad", group: "Kết quả", hidden: true },
  { to: "/organizer/publish-results", label: "Công bố", icon: "campaign", group: "Kết quả", hidden: true },
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

export const participantWorkspaceNav: NavItem[] = [
  { to: "/me", label: "Tổng quan", icon: "dashboard", group: "Tổng quan" },
  { to: "/me/team", label: "Đội của tôi", icon: "groups", group: "Chuẩn bị" },
  { to: "/me/status", label: "Trạng thái đội", icon: "fact_check", group: "Chuẩn bị" },
  { to: "/me/board", label: "Bảng thi", icon: "grid_view", group: "Chuẩn bị" },
  { to: "/me/problem", label: "Đề thi", icon: "code", group: "Ngày thi" },
  { to: "/me/profile", label: "Hồ sơ", icon: "person", group: "Tài khoản" },
  { to: "/me/check-in", label: "Check-in", icon: "how_to_reg", group: "Ngày thi", hidden: true },
  { to: "/me/submission", label: "Bài nộp", icon: "upload", group: "Ngày thi", hidden: true },
  { to: "/me/ai-review", label: "Đánh giá AI", icon: "psychology", group: "Kết quả", hidden: true },
  { to: "/me/results", label: "Kết quả", icon: "leaderboard", group: "Kết quả", hidden: true }
];
