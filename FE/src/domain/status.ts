import type { BadgeTone } from "../components/ui/Badge";

export type WorkflowStatus =
  | "PENDING"
  | "CONFIRMED"
  | "WAITLIST"
  | "REJECTED"
  | "DISQUALIFIED"
  | "DRAFT"
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
  CONFIRMED: "Đã xác nhận",
  WAITLIST: "Danh sách chờ",
  REJECTED: "Từ chối",
  DISQUALIFIED: "Bị loại",
  DRAFT: "Bản nháp",
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
  CONFIRMED: "success",
  WAITLIST: "warning",
  REJECTED: "danger",
  DISQUALIFIED: "danger",
  DRAFT: "neutral",
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
