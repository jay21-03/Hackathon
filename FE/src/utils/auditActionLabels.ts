const auditActionLabels: Record<string, string> = {
  SLOT_ASSIGNED: "Gán đội vào vị trí",
  SLOT_UNASSIGNED: "Gỡ đội khỏi vị trí",
  TEAM_STATUS_CHANGED: "Đổi trạng thái đội",
  TEAM_DISQUALIFIED: "Loại đội",
  TEAM_REJECTED: "Từ chối hồ sơ đội",
  RANKING_PUBLISHED: "Công bố kết quả bảng",
  EVENT_RANKINGS_PUBLISHED: "Công bố kết quả cuộc thi",
  RANKING_CALCULATED: "Tính xếp hạng",
  STAFF_INVITED: "Mời nhân sự",
  ANNOUNCEMENT_SENT: "Gửi thông báo"
};

export function formatAuditAction(action: string) {
  return auditActionLabels[action] ?? "Hoạt động hệ thống";
}
