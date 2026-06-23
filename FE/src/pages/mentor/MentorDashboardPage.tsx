import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { StaffAssignmentDashboard } from "../../components/staff/StaffAssignmentDashboard";
import { Badge } from "../../components/ui/Badge";
import { fetchMentorAssignments, fetchMentorBoardTeams } from "../../services/assignmentService";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { resolveApiError } from "../../utils/apiError";

function formatProblemWindow(releaseAt?: string | null, closeAt?: string | null) {
  if (!releaseAt && !closeAt) return null;
  const fmt = (value: string) =>
    new Date(value).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
  if (releaseAt && closeAt) return `Mở đề ${fmt(releaseAt)} · Đóng ${fmt(closeAt)}`;
  if (releaseAt) return `Mở đề ${fmt(releaseAt)}`;
  return `Đóng đề ${fmt(closeAt!)}`;
}

export function MentorDashboardPage() {
  const query = useQuery({
    queryKey: ["assignments", "mentor"],
    queryFn: fetchMentorAssignments,
    refetchInterval: 30_000
  });
  const [expandedBoardId, setExpandedBoardId] = useState<number | null>(null);

  const teamsQuery = useQuery({
    queryKey: ["mentor", "board-teams", expandedBoardId],
    queryFn: () => fetchMentorBoardTeams(expandedBoardId!),
    enabled: expandedBoardId != null,
    refetchInterval: expandedBoardId != null ? 30_000 : false
  });

  return (
    <StaffAssignmentDashboard
      eyebrow="Mentor"
      title="Bảng được phân công"
      description="Theo dõi các bảng bạn phụ trách và danh sách đội (chỉ xem)."
      assignments={query.data ?? []}
      loading={query.isLoading}
      error={
        query.isError ? resolveApiError(query.error, "Không tải được phân công.") : null
      }
      onRetry={() => void query.refetch()}
      emptyTitle="Chưa có phân công"
      emptyDescription="Ban tổ chức sẽ gán mentor cho bảng tại trang Vận hành bảng."
      boardFooter={(assignment) => {
        const problemWindow = formatProblemWindow(
          assignment.problemReleaseAt,
          assignment.problemCloseAt
        );
        return (
          <div className="space-y-sm border-t border-outline-variant pt-sm">
            <div className="flex flex-wrap items-center gap-sm font-body-sm text-on-surface-variant">
              {assignment.eventId ? (
                <Link
                  to={`/events/${assignment.eventId}`}
                  className="font-label-sm text-primary hover:underline"
                >
                  Xem cuộc thi
                </Link>
              ) : null}
              {problemWindow ? <span>{problemWindow}</span> : null}
            </div>
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
              ) : teamsQuery.isError ? (
                <p className="font-body-sm text-error">
                  {resolveApiError(teamsQuery.error, "Không tải được danh sách đội.")}
                </p>
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
                        <Badge tone={getStatusTone(team.teamStatus)}>
                          {getStatusLabel(team.teamStatus)}
                        </Badge>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )
            ) : null}
          </div>
        );
      }}
    />
  );
}
