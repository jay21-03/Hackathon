import type { TeamDetailResponse } from "../services/registrationService";

const BLOCKED_STATUSES = new Set(["WAITLIST", "REJECTED", "DISQUALIFIED"]);

const STATUS_MESSAGES: Record<string, string> = {
  WAITLIST: "Đội đang trong danh sách chờ — chờ ban tổ chức xác nhận trước khi tiếp tục.",
  REJECTED: "Hồ sơ đội đã bị từ chối — không thể tiếp tục các bước thi.",
  DISQUALIFIED: "Đội đã bị loại khỏi cuộc thi — không thể tiếp tục các bước thi."
};

export function useParticipantTeamGuard(team: TeamDetailResponse | null | undefined) {
  const status = team?.status ?? "";
  const pendingAwaitingBtc = status === "PENDING" && team?.readyForOrganizerApproval;
  const pendingAwaitingMembers = status === "PENDING" && !team?.readyForOrganizerApproval;
  const blocked =
    BLOCKED_STATUSES.has(status) || status === "PENDING";

  let message: string | null = null;
  if (pendingAwaitingBtc) {
    message = "Hồ sơ đội đang chờ BTC duyệt — chưa thể tiếp tục các bước thi.";
  } else if (pendingAwaitingMembers) {
    message = "Đội đang chờ thành viên xác nhận email — hoàn tất xác nhận trước khi thi.";
  } else if (blocked) {
    message = STATUS_MESSAGES[status] ?? "Không thể tiếp tục với trạng thái đội hiện tại.";
  }

  return {
    blocked,
    status,
    message
  };
}
