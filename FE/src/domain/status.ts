import type { BadgeTone } from "../components/ui/Badge";

export type WorkflowStatus =
  | "PENDING"
  | "INVITED"
  | "DECLINED"
  | "CONFIRMED"
  | "WAITLIST"
  | "REJECTED"
  | "DISQUALIFIED"
  | "DRAFT"
  | "REGISTRATION_OPEN"
  | "REGISTRATION_CLOSED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "PUBLISHED"
  | "EXPIRED"
  | "ACCEPTED"
  | "OPEN"
  | "UPCOMING"
  | "ACTIVE"
  | "PENDING_APPROVAL"
  | "DISABLED"
  | "CLOSED"
  | "ENDED"
  | "COMPLETED"
  | "CANCELLED"
  | "PROBLEM_RELEASED"
  | "SCORING"
  | "FAILED";

const statusLabels: Record<WorkflowStatus, string> = {
  PENDING: "Chờ xác nhận",
  INVITED: "Đã gửi lời mời",
  DECLINED: "Đã từ chối",
  CONFIRMED: "Đã xác nhận",
  WAITLIST: "Danh sách chờ",
  REJECTED: "Từ chối",
  DISQUALIFIED: "Bị loại",
  DRAFT: "Bản nháp",
  REGISTRATION_OPEN: "Đang mở đăng ký",
  REGISTRATION_CLOSED: "Đã đóng đăng ký",
  IN_PROGRESS: "Đang diễn ra",
  SUBMITTED: "Đã nộp",
  PUBLISHED: "Đã công bố",
  EXPIRED: "Hết hạn",
  ACCEPTED: "Đã chấp nhận",
  OPEN: "Đang mở đăng ký",
  UPCOMING: "Sắp diễn ra",
  ACTIVE: "Đang hoạt động",
  PENDING_APPROVAL: "Chờ duyệt",
  DISABLED: "Đã vô hiệu",
  CLOSED: "Đã đóng",
  ENDED: "Đã kết thúc",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
  PROBLEM_RELEASED: "Đã mở đề",
  SCORING: "Đang chấm điểm",
  FAILED: "Thất bại"
};

const statusTones: Record<WorkflowStatus, BadgeTone> = {
  PENDING: "warning",
  INVITED: "active",
  DECLINED: "danger",
  CONFIRMED: "success",
  WAITLIST: "warning",
  REJECTED: "danger",
  DISQUALIFIED: "danger",
  DRAFT: "neutral",
  REGISTRATION_OPEN: "active",
  REGISTRATION_CLOSED: "warning",
  IN_PROGRESS: "active",
  SUBMITTED: "success",
  PUBLISHED: "active",
  EXPIRED: "neutral",
  ACCEPTED: "success",
  OPEN: "active",
  UPCOMING: "success",
  ACTIVE: "active",
  PENDING_APPROVAL: "warning",
  DISABLED: "danger",
  CLOSED: "warning",
  ENDED: "warning",
  COMPLETED: "success",
  CANCELLED: "danger",
  PROBLEM_RELEASED: "active",
  SCORING: "warning",
  FAILED: "danger"
};

export function normalizeStatus(status?: string): WorkflowStatus | string {
  const value = (status ?? "").trim().toUpperCase();
  if (!value) return "PENDING";
  if (value in statusLabels) return value as WorkflowStatus;
  if (value.includes("REGISTRATION")) return "UPCOMING";
  if (value.includes("APPROVED")) return "CONFIRMED";
  if (value.includes("COMPLETE")) return "COMPLETED";
  return value;
}

export function getStatusLabel(status?: string) {
  const normalized = normalizeStatus(status);
  return normalized in statusLabels
    ? statusLabels[normalized as WorkflowStatus]
    : String(status ?? "Chờ xác nhận");
}

export function getStatusTone(status?: string): BadgeTone {
  const normalized = normalizeStatus(status);
  return normalized in statusTones ? statusTones[normalized as WorkflowStatus] : "neutral";
}

export function getTeamRegistrationStatusLabel(team: {
  status?: string;
  readyForOrganizerApproval?: boolean;
}) {
  if ((team.status ?? "").toUpperCase() === "PENDING" && team.readyForOrganizerApproval) {
    return "Chờ BTC duyệt";
  }
  return getStatusLabel(team.status);
}

export function getTeamRegistrationStatusTone(team: {
  status?: string;
  readyForOrganizerApproval?: boolean;
}): BadgeTone {
  if ((team.status ?? "").toUpperCase() === "PENDING" && team.readyForOrganizerApproval) {
    return "warning";
  }
  return getStatusTone(team.status);
}
