export type NavItem = {
  to: string;
  label: string;
  icon: string;
  group?: string;
};

export const organizerNav: NavItem[] = [
  { to: "/organizer/dashboard", label: "Tong quan", icon: "dashboard", group: "Tong quan" },
  { to: "/organizer/events", label: "Cuoc thi", icon: "event", group: "Thiet lap" },
  { to: "/organizer/problems", label: "De thi", icon: "code_blocks", group: "Thiet lap" },
  { to: "/organizer/rubric", label: "Tieu chi cham", icon: "data_object", group: "Thiet lap" },
  { to: "/organizer/registrations", label: "Dang ky doi", icon: "fact_check", group: "Dang ky va phan cong" },
  { to: "/organizer/users", label: "Nguoi dung", icon: "manage_accounts", group: "Dang ky va phan cong" },
  { to: "/organizer/invitations", label: "Loi moi", icon: "mail", group: "Dang ky va phan cong" },
  { to: "/organizer/boards", label: "Bang cham", icon: "grid_view", group: "Dang ky va phan cong" },
  { to: "/organizer/assignments", label: "Mentor va giam khao", icon: "supervisor_account", group: "Dang ky va phan cong" },
  { to: "/organizer/check-ins", label: "Check-in", icon: "group_add", group: "Van hanh ngay thi" },
  { to: "/organizer/scoring", label: "Tien do cham", icon: "gavel", group: "Cham diem" },
  { to: "/organizer/ai-auditor", label: "Kiem tra AI", icon: "policy", group: "Cham diem" },
  { to: "/organizer/ai-insights", label: "Nhan xet AI", icon: "psychology", group: "Cham diem" },
  { to: "/organizer/ranking", label: "Xep hang", icon: "leaderboard", group: "Ket qua" },
  { to: "/organizer/finals", label: "Chung ket", icon: "workspace_premium", group: "Ket qua" },
  { to: "/organizer/disqualifications", label: "Xu ly vi pham", icon: "gpp_bad", group: "Ket qua" },
  { to: "/organizer/publish-results", label: "Cong bo", icon: "campaign", group: "Ket qua" },
  { to: "/organizer/announcements", label: "Thong bao", icon: "notifications", group: "Truyen thong" },
  { to: "/organizer/notifications", label: "Trung tam thong bao", icon: "mark_email_read", group: "Truyen thong" },
  { to: "/organizer/export-success", label: "Xuat ket qua", icon: "download", group: "Truyen thong" }
];

export const judgeNav: NavItem[] = [
  { to: "/judge/dashboard", label: "Doi duoc cham", icon: "assignment", group: "Cham diem" },
  { to: "/judge/scoring", label: "Phieu cham", icon: "gavel", group: "Cham diem" }
];

export const mentorNav: NavItem[] = [
  { to: "/mentor/dashboard", label: "Doi phu trach", icon: "groups", group: "Theo doi" },
  { to: "/mentor/ai-review", label: "Danh gia AI", icon: "psychology", group: "Theo doi" }
];

export const participantWorkspaceNav: NavItem[] = [
  { to: "/me", label: "Tong quan", icon: "dashboard", group: "Tong quan" },
  { to: "/me/team", label: "Doi cua toi", icon: "groups", group: "Chuan bi" },
  { to: "/me/status", label: "Trang thai doi", icon: "fact_check", group: "Chuan bi" },
  { to: "/me/board", label: "Bang thi", icon: "grid_view", group: "Chuan bi" },
  { to: "/me/check-in", label: "Check-in", icon: "how_to_reg", group: "Ngay thi" },
  { to: "/me/problem", label: "De thi", icon: "code", group: "Ngay thi" },
  { to: "/me/submission", label: "Bai nop", icon: "upload", group: "Ngay thi" },
  { to: "/me/ai-review", label: "Danh gia AI", icon: "psychology", group: "Ket qua" },
  { to: "/me/results", label: "Ket qua", icon: "leaderboard", group: "Ket qua" },
  { to: "/me/profile", label: "Ho so", icon: "person", group: "Tai khoan" }
];
