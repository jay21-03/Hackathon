export type NavItem = {
  to: string;
  label: string;
  icon: string;
};

export const organizerNav: NavItem[] = [
  { to: "/organizer/dashboard", label: "Tong quan", icon: "dashboard" },
  { to: "/organizer/events", label: "Cuoc thi", icon: "event" },
  { to: "/organizer/registrations", label: "Dang ky doi", icon: "fact_check" },
  { to: "/organizer/users", label: "Nguoi dung", icon: "manage_accounts" },
  { to: "/organizer/problems", label: "De thi", icon: "code_blocks" },
  { to: "/organizer/rubric", label: "Tieu chi cham", icon: "data_object" },
  { to: "/organizer/boards", label: "Bang cham", icon: "grid_view" },
  { to: "/organizer/assignments", label: "Phan cong", icon: "supervisor_account" },
  { to: "/organizer/invitations", label: "Loi moi", icon: "mail" },
  { to: "/organizer/check-ins", label: "Check-ins", icon: "group_add" },
  { to: "/organizer/scoring", label: "Cham diem", icon: "gavel" },
  { to: "/organizer/ai-auditor", label: "Danh gia AI", icon: "psychology" },
  { to: "/organizer/ranking", label: "Xep hang", icon: "leaderboard" },
  { to: "/organizer/announcements", label: "Thong bao", icon: "campaign" }
];

export const judgeNav: NavItem[] = [
  { to: "/judge/dashboard", label: "Doi duoc cham", icon: "assignment" },
  { to: "/judge/scoring", label: "Phieu cham", icon: "gavel" }
];

export const mentorNav: NavItem[] = [
  { to: "/mentor/dashboard", label: "Doi phu trach", icon: "groups" },
  { to: "/mentor/ai-review", label: "Danh gia AI", icon: "psychology" }
];

export const participantWorkspaceNav: NavItem[] = [
  { to: "/me", label: "Tong quan", icon: "dashboard" },
  { to: "/me/team", label: "Doi cua toi", icon: "groups" },
  { to: "/me/status", label: "Trang thai doi", icon: "fact_check" },
  { to: "/me/board", label: "Bang thi", icon: "grid_view" },
  { to: "/me/profile", label: "Ho so", icon: "person" },
  { to: "/me/check-in", label: "Check-in", icon: "how_to_reg" },
  { to: "/me/problem", label: "De thi", icon: "code" },
  { to: "/me/submission", label: "Bai nop", icon: "upload" },
  { to: "/me/ai-review", label: "Danh gia AI", icon: "psychology" },
  { to: "/me/results", label: "Ket qua", icon: "leaderboard" }
];
