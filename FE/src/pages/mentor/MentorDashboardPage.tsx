import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StaffAssignmentDashboard } from "../../components/staff/StaffAssignmentDashboard";
import { Badge } from "../../components/ui/Badge";
import { fetchMentorAssignments, fetchMentorBoardTeams } from "../../services/assignmentService";
import { getStatusLabel, getStatusTone } from "../../domain/status";

export function MentorDashboardPage() {
  const query = useQuery({
    queryKey: ["assignments", "mentor"],
    queryFn: fetchMentorAssignments
  });
  const [expandedBoardId, setExpandedBoardId] = useState<number | null>(null);

  const teamsQuery = useQuery({
    queryKey: ["mentor", "board-teams", expandedBoardId],
    queryFn: () => fetchMentorBoardTeams(expandedBoardId!),
    enabled: expandedBoardId != null
  });

  return (
    <StaffAssignmentDashboard
      eyebrow="Mentor"
      title="Bảng được phân công"
      description="Theo dõi các bảng bạn phụ trách và danh sách đội (chỉ xem)."
      assignments={query.data ?? []}
      loading={query.isLoading}
      error={query.error}
      emptyTitle="Chưa có phân công"
      emptyDescription="Ban tổ chức sẽ gán mentor cho bảng tại trang Phân công."
      boardFooter={(assignment) => (
        <div className="space-y-sm border-t border-outline-variant pt-sm">
          <button
            type="button"
            className="font-label-sm text-primary hover:underline"
            onClick={() =>
              setExpandedBoardId((prev) =>
                prev === assignment.boardId ? null : assignment.boardId
              )
            }
          >
            {expandedBoardId === assignment.boardId ? "Ẩn danh sách đội" : "Xem đội trên bảng"}
          </button>
          {expandedBoardId === assignment.boardId ? (
            teamsQuery.isLoading ? (
              <p className="font-body-sm text-on-surface-variant">Đang tải…</p>
            ) : (teamsQuery.data ?? []).length === 0 ? (
              <p className="font-body-sm text-on-surface-variant">Chưa gán đội vào bảng thi.</p>
            ) : (
              <ul className="space-y-xs font-body-sm">
                {(teamsQuery.data ?? []).map((team) => (
                  <li key={team.teamId} className="flex items-center justify-between gap-sm">
                    <span>
                      #{team.slotNumber} {team.teamName}
                    </span>
                    {team.teamStatus ? (
                      <Badge tone={getStatusTone(team.teamStatus)}>{getStatusLabel(team.teamStatus)}</Badge>
                    ) : null}
                  </li>
                ))}
              </ul>
            )
          ) : null}
        </div>
      )}
    />
  );
}
