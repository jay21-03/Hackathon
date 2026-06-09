import type { TeamDetailResponse } from "../services/registrationService";

const BLOCKED_STATUSES = new Set(["WAITLIST", "REJECTED", "DISQUALIFIED"]);

const STATUS_MESSAGES: Record<string, string> = {
  WAITLIST: "Đội đang trong danh sách chờ — chờ ban tổ chức xác nhận trước khi tiếp tục.",
  REJECTED: "Hồ sơ đội đã bị từ chối — không thể tiếp tục các bước thi.",
  DISQUALIFIED: "Đội đã bị loại khỏi cuộc thi — không thể tiếp tục các bước thi."
};

export function useParticipantTeamGuard(team: TeamDetailResponse | null | undefined) {
  const status = team?.status ?? "";
  const blocked = BLOCKED_STATUSES.has(status);
  return {
    blocked,
    status,
    message: blocked ? (STATUS_MESSAGES[status] ?? "Không thể tiếp tục với trạng thái đội hiện tại.") : null
  };
}
