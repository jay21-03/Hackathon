import { Link } from "react-router-dom";
import { Badge } from "../ui/Badge";
import { Modal } from "../ui/Modal";
import { ModuleSkeleton } from "../ui/ModuleSkeleton";
import { enableAiReview } from "../../config/features";
import {
  getStatusLabel,
  getStatusTone,
  getTeamRegistrationStatusLabel,
  getTeamRegistrationStatusTone
} from "../../domain/status";
import type { TeamDetailResponse } from "../../services/registrationService";

interface TeamDetailModalProps {
  open: boolean;
  loading?: boolean;
  team: TeamDetailResponse | null;
  contextLabel?: string;
  onClose: () => void;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" });
}

function countMembers(team: TeamDetailResponse) {
  const members = team.members ?? [];
  const confirmed = members.filter((member) => member.status === "CONFIRMED").length;
  return { total: members.length, confirmed };
}

export function TeamDetailModal({
  open,
  loading = false,
  team,
  contextLabel,
  onClose
}: TeamDetailModalProps) {
  const memberStats = team ? countMembers(team) : null;

  return (
    <Modal open={open} title={team?.name ?? "Chi tiết đội"} onClose={onClose} size="xl">
      {loading ? (
        <ModuleSkeleton rows={4} />
      ) : team ? (
        <div className="space-y-md">
          <div className="flex flex-wrap items-center gap-sm">
            {contextLabel ? (
              <p className="font-body-sm text-on-surface-variant">{contextLabel}</p>
            ) : null}
            <Badge tone={getTeamRegistrationStatusTone(team)}>
              {getTeamRegistrationStatusLabel(team)}
            </Badge>
            {memberStats ? (
              <span className="font-body-sm text-on-surface-variant">
                {memberStats.confirmed}/{memberStats.total} thành viên đã xác nhận
              </span>
            ) : null}
            {team.confirmedAt ? (
              <span className="font-body-sm text-on-surface-variant">
                Duyệt lúc {formatDate(team.confirmedAt)}
              </span>
            ) : null}
          </div>

          {team.rejectedReason &&
          (team.status === "REJECTED" || team.status === "DISQUALIFIED") ? (
            <div className="rounded-lg border border-danger/30 bg-danger-container/30 px-sm py-2">
              <p className="font-label-sm text-on-danger-container">Lý do</p>
              <p className="mt-xs font-body-sm text-on-danger-container">{team.rejectedReason}</p>
            </div>
          ) : null}

          {enableAiReview && team ? (
            <p className="font-body-sm">
              <Link
                to={`/organizer/ai-reviews?teamId=${team.id}&eventId=${team.eventId}`}
                className="text-primary underline-offset-2 hover:underline"
              >
                Xem đánh giá AI & rubric R1/R2
              </Link>
            </p>
          ) : null}

          {(team.members ?? []).length === 0 ? (
            <p className="font-body-sm text-on-surface-variant">Đội chưa có thành viên.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-outline-variant">
              <table className="w-full min-w-[640px] text-left font-body-sm">
                <thead className="bg-surface-container-low font-label-sm text-on-surface-variant">
                  <tr>
                    <th className="px-sm py-2">Họ tên</th>
                    <th className="px-sm py-2">Email</th>
                    <th className="px-sm py-2">MSSV</th>
                    <th className="px-sm py-2">Trường</th>
                    <th className="px-sm py-2">Vai trò</th>
                    <th className="px-sm py-2">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/60">
                  {(team.members ?? []).map((member) => (
                    <tr key={member.id} className="text-on-surface">
                      <td className="px-sm py-2 font-label-sm">{member.fullName}</td>
                      <td className="px-sm py-2 text-on-surface-variant">{member.email}</td>
                      <td className="px-sm py-2">{member.studentId?.trim() || "—"}</td>
                      <td className="px-sm py-2">{member.university?.trim() || "—"}</td>
                      <td className="px-sm py-2">
                        {member.contactPerson ? (
                          <Badge tone="active">Đội trưởng</Badge>
                        ) : (
                          <span className="text-on-surface-variant">Thành viên</span>
                        )}
                      </td>
                      <td className="px-sm py-2">
                        <Badge tone={getStatusTone(member.status)}>{getStatusLabel(member.status)}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <p className="font-body-sm text-on-surface-variant">Không tải được thông tin đội.</p>
      )}
    </Modal>
  );
}
