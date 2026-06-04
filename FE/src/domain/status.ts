import type { BadgeTone } from "../components/ui/Badge";

export type WorkflowStatus =
  | "PENDING"
  | "INVITED"
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
  | "OPEN"
  | "UPCOMING"
  | "ACTIVE"
  | "CLOSED"
  | "ENDED"
  | "COMPLETED"
  | "FAILED";

const statusLabels: Record<WorkflowStatus, string> = {
  PENDING: "Chờ xác nhận",
  INVITED: "Đã gửi lời mời",
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
  OPEN: "Đang mở đăng ký",
  UPCOMING: "Sắp diễn ra",
  ACTIVE: "Đang diễn ra",
  CLOSED: "Đã đóng",
  ENDED: "Đã kết thúc",
  COMPLETED: "Hoàn tất",
  FAILED: "Thất bại"
};

const statusTones: Record<WorkflowStatus, BadgeTone> = {
  PENDING: "warning",
  INVITED: "active",
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
  OPEN: "active",
  UPCOMING: "success",
  ACTIVE: "active",
  CLOSED: "warning",
  ENDED: "warning",
  COMPLETED: "success",
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
