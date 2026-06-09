import { Badge } from "../ui/Badge";
import { Modal } from "../ui/Modal";
import { ModuleSkeleton } from "../ui/ModuleSkeleton";
import { getStatusLabel, getStatusTone } from "../../domain/status";
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
            <Badge tone={getStatusTone(team.status)}>{getStatusLabel(team.status)}</Badge>
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

          {(team.members ?? []).length === 0 ? (
            <p className="font-body-sm text-on-surface-variant">Đội chưa có thành viên.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-outline-variant">
              <table className="w-full min-w-[640px] text-left font-body-sm">
                <thead className="bg-surface-container-low font-label-sm text-on-surface-variant">
                  <tr>
                    <th className="px-md py-sm">Họ tên</th>
                    <th className="px-md py-sm">Email</th>
                    <th className="px-md py-sm">MSSV</th>
                    <th className="px-md py-sm">Trường</th>
                    <th className="px-md py-sm">Vai trò</th>
                    <th className="px-md py-sm">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/60">
                  {(team.members ?? []).map((member) => (
                    <tr key={member.id} className="text-on-surface">
                      <td className="px-md py-sm font-label-sm">{member.fullName}</td>
                      <td className="px-md py-sm text-on-surface-variant">{member.email}</td>
                      <td className="px-md py-sm">{member.studentId?.trim() || "—"}</td>
                      <td className="px-md py-sm">{member.university?.trim() || "—"}</td>
                      <td className="px-md py-sm">
                        {member.contactPerson ? (
                          <Badge tone="active">Đội trưởng</Badge>
                        ) : (
                          <span className="text-on-surface-variant">Thành viên</span>
                        )}
                      </td>
                      <td className="px-md py-sm">
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
