import type {
  BulkStaffInvitationResponse,
  StaffInvitationResponse
} from "../services/staffInvitationService";

export function staffInviteSuccessMessage(result: StaffInvitationResponse) {
  if (result.status === "ACCEPTED") {
    return "Đã chuyển sang kỳ mới và gán vào bảng — không cần gửi email.";
  }
  return "Đã gửi lời mời mentor/giám khảo qua email.";
}

export function bulkStaffInviteSuccessMessage(result: BulkStaffInvitationResponse) {
  const carried = result.succeeded.filter((row) => row.status === "ACCEPTED").length;
  const emailed = result.succeeded.length - carried;
  const parts: string[] = [];
  if (carried > 0) {
    parts.push(`${carried} người chuyển kỳ (không gửi mail)`);
  }
  if (emailed > 0) {
    parts.push(`${emailed} lời mời qua email`);
  }
  if (result.failedCount > 0) {
    return `${parts.join(", ") || "0 thành công"}. ${result.failedCount} lỗi.`;
  }
  return parts.length ? `Hoàn tất: ${parts.join(", ")}.` : "Không có lời mời nào được xử lý.";
}
