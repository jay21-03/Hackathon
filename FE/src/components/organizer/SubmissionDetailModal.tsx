import type { ReactNode } from "react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Modal } from "../ui/Modal";
import { ModuleSkeleton } from "../ui/ModuleSkeleton";
import { formatRepositoryTimestamp } from "../../services/repositoryProvisioningService";
import type { AdminTeamSubmissionResponse } from "../../services/submissionApi";

interface SubmissionDetailModalProps {
  open: boolean;
  loading?: boolean;
  detail: AdminTeamSubmissionResponse | null;
  boardLabel?: string | null;
  onClose: () => void;
}

function statusLabel(status: string | null | undefined) {
  if (status === "SUBMITTED") return "Đã nộp";
  if (status === "DRAFT") return "Bản nháp";
  return "Chưa nộp";
}

function statusTone(status: string | null | undefined): "success" | "warning" | "neutral" {
  if (status === "SUBMITTED") return "success";
  if (status === "DRAFT") return "warning";
  return "neutral";
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-outline-variant/50 py-sm last:border-b-0 sm:grid-cols-[10rem_1fr] sm:gap-md">
      <dt className="font-label-sm text-on-surface-variant">{label}</dt>
      <dd className="font-body-sm text-on-surface">{children}</dd>
    </div>
  );
}

export function SubmissionDetailModal({
  open,
  loading = false,
  detail,
  boardLabel,
  onClose
}: SubmissionDetailModalProps) {
  const displayBoardLabel =
    boardLabel ??
    (detail?.boardName ?? (detail?.boardId != null ? `Bảng #${detail.boardId}` : "—"));

  return (
    <Modal
      open={open}
      title={detail ? `Chi tiết — ${detail.teamName}` : "Chi tiết bài nộp"}
      onClose={onClose}
      size="xl"
    >
      {loading ? (
        <ModuleSkeleton rows={4} />
      ) : detail ? (
        <div className="space-y-lg">
          <dl className="rounded-xl border border-outline-variant bg-surface-container-low px-md">
            <InfoRow label="Đội">{detail.teamName}</InfoRow>
            <InfoRow label="Vòng · Bảng">
              {displayBoardLabel}
              {detail.slotNumber != null ? (
                <span className="text-on-surface-variant"> · Vị trí #{detail.slotNumber}</span>
              ) : null}
            </InfoRow>
            <InfoRow label="Trạng thái">
              <Badge tone={statusTone(detail.status)}>{statusLabel(detail.status)}</Badge>
            </InfoRow>
            <InfoRow label="Nộp lúc">
              {detail.submittedAt
                ? new Date(detail.submittedAt).toLocaleString("vi-VN")
                : "—"}
            </InfoRow>
            <InfoRow label="Lần push cuối">
              {formatRepositoryTimestamp(detail.lastPushAt) ?? "Chưa có push qua webhook"}
            </InfoRow>
            <InfoRow label="Repository">
              {detail.repositoryUrl ? (
                <a
                  href={detail.repositoryUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-primary hover:underline"
                >
                  {detail.repositoryName ?? detail.repositoryUrl}
                </a>
              ) : (
                <span className="text-on-surface-variant">Chưa có link repository</span>
              )}
            </InfoRow>
          </dl>

          {detail.repositoryUrl ? (
            <div className="flex flex-wrap gap-sm">
              <Button
                type="button"
                variant="secondary"
                onClick={() => window.open(detail.repositoryUrl!, "_blank", "noopener,noreferrer")}
              >
                <Icon name="open_in_new" className="text-[18px]" />
                Mở repository
              </Button>
            </div>
          ) : null}

          <div className="flex justify-end border-t border-outline-variant pt-md">
            <Button type="button" variant="ghost" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
