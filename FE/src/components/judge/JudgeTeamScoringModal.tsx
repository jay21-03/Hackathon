import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Modal } from "../ui/Modal";
import { JudgeTeamScoreStatusBanner } from "./JudgeTeamScoreStatusBanner";
import { getTeamScoreStatus } from "./judgeTeamScoreStatus";
import {
  ACCESS_STATUS_LABELS,
  PROVISION_STATUS_LABELS,
  accessStatusTone,
  provisionStatusTone
} from "../../services/repositoryProvisioningService";
import type { JudgeRepositoryResponse } from "../../services/judgeRepositoryService";
import type { CriteriaResponse, MatrixTeamRowResponse } from "../../services/scoringApi";
import { useToast } from "../feedback/ToastProvider";
import { enableAiReview } from "../../config/features";

type CellKey = `${number}-${number}`;

interface JudgeTeamScoringModalProps {
  open: boolean;
  team: MatrixTeamRowResponse | null;
  boardId?: number | null;
  criteria: CriteriaResponse[];
  cells: Record<CellKey, string>;
  feedback: string;
  repository?: JudgeRepositoryResponse | null;
  saving: boolean;
  submitting: boolean;
  expandedCriteriaId: number | null;
  onClose: () => void;
  onCellChange: (criteriaId: number, value: string) => void;
  onFeedbackChange: (value: string) => void;
  onToggleCriteria: (criteriaId: number | null) => void;
  onSave: () => void;
  onSubmit: () => void;
}

function cellKey(teamId: number, criteriaId: number): CellKey {
  return `${teamId}-${criteriaId}`;
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-md">
      <dt className="font-label-sm text-on-surface-variant">{label}</dt>
      <dd className="font-body-sm text-on-surface">{children}</dd>
    </div>
  );
}

export function JudgeTeamScoringModal({
  open,
  team,
  boardId,
  criteria,
  cells,
  feedback,
  repository,
  saving,
  submitting,
  expandedCriteriaId,
  onClose,
  onCellChange,
  onFeedbackChange,
  onToggleCriteria,
  onSave,
  onSubmit
}: JudgeTeamScoringModalProps) {
  const { notify } = useToast();

  if (!team) return null;

  const filledByCriteria = Object.fromEntries(
    criteria.map((criterion) => [criterion.id, cells[cellKey(team.teamId, criterion.id)] ?? ""])
  );
  const scoreStatus = getTeamScoreStatus(team, criteria.length, filledByCriteria);

  const repoUrl = repository?.repositoryUrl ?? team.repositoryUrl ?? null;
  const cloneUrl = repository?.cloneUrl ?? (repoUrl ? `${repoUrl.replace(/\/$/, "")}.git` : null);
  const canOpenRepo =
    Boolean(repoUrl) &&
    repository?.provisionStatus !== "FAILED" &&
    (repository == null ||
      repository.provisionStatus === "CREATED" ||
      !repository.judgeHasGithubUsername ||
      repository.judgeGithubAccessGranted !== false);

  const repoAccessHint = !repository?.judgeHasGithubUsername
    ? "Cập nhật GitHub username trong hồ sơ để được cấp quyền xem repo."
    : repository?.judgeGithubAccessGranted === false
      ? "Bạn chưa được cấp quyền xem repo — liên hệ Ban tổ chức để được grant quyền read/pull."
      : repository?.judgeGithubAccessGranted === true
        ? "Bạn đã được cấp quyền xem repo trên GitHub."
        : null;

  async function copyCloneUrl() {
    if (!cloneUrl) return;
    try {
      await navigator.clipboard.writeText(cloneUrl);
      notify("Đã copy clone URL.", "success");
    } catch {
      notify("Không copy được URL.", "danger");
    }
  }

  return (
    <Modal
      open={open}
      title={`Chấm điểm — ${team.teamName}`}
      onClose={onClose}
      size="2xl"
    >
      <div className="space-y-lg">
        <JudgeTeamScoreStatusBanner status={scoreStatus} />

        <div className="grid gap-lg lg:grid-cols-2">
          <section className="rounded-xl border border-outline-variant bg-surface-container-low p-md space-y-md">
            <h3 className="font-label-md text-on-surface">Thông tin đội</h3>
            <dl className="space-y-sm">
              <InfoRow label="Tên đội">{team.teamName}</InfoRow>
              <InfoRow label="Vị trí trình bày">#{team.slotNumber}</InfoRow>
              <InfoRow label="Phiếu chấm">
                {team.status === "SUBMITTED" ? "Đã nộp — có thể cập nhật" : "Nháp (chưa nộp)"}
              </InfoRow>
              <InfoRow label="Tổng điểm">
                {team.computed?.judgeTeamScore != null
                  ? Number(team.computed.judgeTeamScore).toFixed(2)
                  : "Chưa có — nhập điểm để tính"}
              </InfoRow>
              <InfoRow label="Tiến độ chấm">
                {Object.values(filledByCriteria).filter((v) => v !== "").length}/{criteria.length} tiêu chí
              </InfoRow>
            </dl>
          </section>

          <section className="rounded-xl border border-outline-variant bg-surface-container-low p-md space-y-md">
            <h3 className="font-label-md text-on-surface">Repository GitHub</h3>
            <dl className="space-y-sm">
              {repository?.problemTitle ? (
                <InfoRow label="Đề bài">{repository.problemTitle}</InfoRow>
              ) : null}
              <InfoRow label="Trạng thái repo">
                {!repoUrl ? (
                  "Chưa có repository cho đội này"
                ) : repository ? (
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={accessStatusTone(repository.accessStatus)}>
                      Truy cập: {ACCESS_STATUS_LABELS[repository.accessStatus]}
                    </Badge>
                    <Badge tone={provisionStatusTone(repository.provisionStatus)}>
                      Cấp repo: {PROVISION_STATUS_LABELS[repository.provisionStatus]}
                    </Badge>
                  </div>
                ) : (
                  "Đã có link repository"
                )}
              </InfoRow>
              {repoUrl ? (
                <InfoRow label="URL">
                  <a
                    href={repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-primary hover:underline"
                  >
                    {repoUrl}
                  </a>
                </InfoRow>
              ) : null}
              {repoAccessHint ? (
                <InfoRow label="Quyền GK">
                  <span className="text-on-surface-variant">{repoAccessHint}</span>
                </InfoRow>
              ) : null}
            </dl>
            {repoUrl ? (
              <div className="flex flex-wrap gap-sm border-t border-outline-variant/60 pt-md">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!canOpenRepo}
                  onClick={() => window.open(repoUrl, "_blank", "noopener,noreferrer")}
                >
                  <Icon name="open_in_new" className="text-[18px]" />
                  Mở GitHub
                </Button>
                {cloneUrl ? (
                  <Button type="button" variant="ghost" onClick={() => void copyCloneUrl()}>
                    <Icon name="content_copy" className="text-[18px]" />
                    Copy clone URL
                  </Button>
                ) : null}
              </div>
            ) : null}
            {enableAiReview && repository?.provisionStatus === "CREATED" ? (
              <div className="border-t border-outline-variant/60 pt-md">
                <Link
                  to={`/judge/ai-review?${new URLSearchParams({
                    ...(boardId != null ? { boardId: String(boardId) } : {}),
                    teamId: String(team.teamId)
                  }).toString()}`}
                  className="inline-flex items-center gap-1 font-label-sm text-primary hover:underline"
                >
                  <Icon name="psychology" className="text-[18px]" />
                  Xem rubric AI (R1/R2)
                </Link>
              </div>
            ) : null}
          </section>
        </div>

        <section className="space-y-md">
          <div className="flex flex-wrap items-end justify-between gap-sm">
            <div>
              <h3 className="font-label-md text-on-surface">Phiếu chấm</h3>
              <p className="font-body-sm text-on-surface-variant">
                Nhập điểm từng tiêu chí. Bấm tên tiêu chí để xem mô tả rubric.
              </p>
            </div>
            <p className="font-label-sm text-on-surface-variant">
              {criteria.length} tiêu chí · thang 0–10
            </p>
          </div>

          <div className="space-y-sm">
            {criteria.map((criterion) => {
              const key = cellKey(team.teamId, criterion.id);
              const expanded = expandedCriteriaId === criterion.id;
              const cellValue = cells[key] ?? "";
              return (
                <div
                  key={criterion.id}
                  className="rounded-xl border border-outline-variant bg-surface-container p-md"
                >
                  <div className="grid gap-md lg:grid-cols-[1fr_auto] lg:items-center">
                    <div className="min-w-0 space-y-1">
                      <button
                        type="button"
                        className="flex items-start gap-1 text-left font-label-md text-primary hover:underline"
                        onClick={() => onToggleCriteria(expanded ? null : criterion.id)}
                      >
                        <Icon
                          name={expanded ? "expand_less" : "expand_more"}
                          className="mt-0.5 shrink-0 text-[20px]"
                        />
                        <span>
                          {criterion.code} — {criterion.name}
                        </span>
                      </button>
                      <p className="pl-6 font-body-sm text-on-surface-variant">
                        Trọng số {criterion.weight}% · điểm {criterion.minScore}–{criterion.maxScore}
                      </p>
                    </div>
                    <label className="flex items-center gap-sm lg:justify-end">
                      <span className="font-label-sm text-on-surface-variant">Điểm</span>
                      <input
                        type="number"
                        min={criterion.minScore}
                        max={criterion.maxScore}
                        step={0.1}
                    className="w-24 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-center font-label-md"
                        value={cellValue}
                        onChange={(e) => onCellChange(criterion.id, e.target.value)}
                        placeholder="—"
                      />
                    </label>
                  </div>
                  {expanded ? (
                    <div className="mt-md grid gap-sm border-t border-outline-variant/60 pt-md md:grid-cols-2">
                      {criterion.levelDescriptors?.map((level) => (
                        <div key={level.level} className="rounded-lg border border-outline-variant/60 p-sm">
                          <p className="font-label-sm text-on-surface">
                            {level.label} ({level.minScore}–{level.maxScore})
                          </p>
                          <p className="font-body-sm text-on-surface-variant">{level.description || "—"}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <label className="block space-y-xs">
          <span className="font-label-md text-on-surface">Ghi chú chung</span>
          <textarea
            className="min-h-[6rem] w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
            placeholder="Nhận xét tổng quan về bài làm của đội (tùy chọn)"
            value={feedback}
            onChange={(e) => onFeedbackChange(e.target.value)}
          />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-sm border-t border-outline-variant pt-md">
          <p className="font-body-sm text-on-surface-variant">
            {team.status === "SUBMITTED"
              ? "Chỉnh sửa điểm rồi bấm Cập nhật phiếu để lưu thay đổi chính thức."
              : "Lưu nháp giữ điểm tạm; Nộp phiếu để gửi kết quả chính thức."}
          </p>
          <div className="flex flex-wrap gap-sm">
            <Button type="button" variant="ghost" onClick={onClose}>
              Đóng
            </Button>
            <Button type="button" variant="secondary" loading={saving} onClick={onSave}>
              {team.status === "SUBMITTED" ? "Lưu thay đổi" : "Lưu nháp"}
            </Button>
            <Button type="button" loading={submitting} onClick={onSubmit}>
              {team.status === "SUBMITTED" ? "Cập nhật phiếu" : "Nộp phiếu"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
