export type EventLifecycleStatus =
  | "DRAFT"
  | "REGISTRATION_OPEN"
  | "REGISTRATION_CLOSED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export function normalizeEventStatus(status?: string): EventLifecycleStatus | string {
  return (status ?? "DRAFT").toUpperCase();
}

export function isTerminalEventStatus(status?: string) {
  const value = normalizeEventStatus(status);
  return value === "COMPLETED" || value === "CANCELLED";
}

export function eventLifecycleHint(
  status?: string,
  registrationStartAt?: string,
  registrationEndAt?: string,
  startDate?: string,
  endDate?: string
) {
  const value = normalizeEventStatus(status);
  const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString("vi-VN") : "");
  const parts: string[] = [
    "Hệ thống tự chuyển trạng thái theo lịch (mỗi ~60 giây) hoặc BTC bấm nút bên dưới."
  ];

  if (value === "DRAFT" && registrationStartAt) {
    parts.push(`Tự mở đăng ký: ${fmt(registrationStartAt)}.`);
  }
  if (value === "REGISTRATION_OPEN" && registrationEndAt) {
    parts.push(`Tự đóng đăng ký: ${fmt(registrationEndAt)}.`);
  }
  if (value === "REGISTRATION_CLOSED" && startDate) {
    parts.push(`Tự bắt đầu thi: ${startDate}.`);
  }
  if (value === "IN_PROGRESS" && endDate) {
    parts.push(`Tự kết thúc: sau ngày ${endDate}.`);
  }

  return parts.join(" ");
}
