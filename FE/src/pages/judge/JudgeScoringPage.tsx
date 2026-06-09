import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button, ButtonLink } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { WorkflowSteps } from "../../components/ui/WorkflowSteps";
import { buildJudgeWorkflowSteps } from "../../domain/judgeWorkflow";
import { StatCard } from "../../components/ui/StatCard";
import { useJudgeAssignments } from "../../hooks/useJudgeAssignments";
import { useScoreMatrix } from "../../hooks/useScoreMatrix";
import { invalidateAfterScoreMatrixMutation } from "../../lib/invalidateScoringQueries";
import {
  saveScoreMatrix,
  submitScoreMatrix,
  type ScoreMatrixResponse
} from "../../services/scoringApi";
import { resolveApiError } from "../../utils/apiError";
import { mapOrganizerErrorMessage } from "../../utils/organizerErrors";

type CellKey = `${number}-${number}`;

function cellKey(teamId: number, criteriaId: number): CellKey {
  return `${teamId}-${criteriaId}`;
}

function buildCellMap(matrix: ScoreMatrixResponse | null): Record<CellKey, string> {
  if (!matrix) return {};
  const map: Record<CellKey, string> = {};
  for (const row of matrix.teams) {
    for (const score of row.scores) {
      if (score.scoreValue != null) {
        map[cellKey(row.teamId, score.criteriaId)] = String(score.scoreValue);
      }
    }
  }
  return map;
}

export function JudgeScoringPage() {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const boardIdParam = searchParams.get("boardId");
  const { assignments, loading: assignmentsLoading, error: assignmentsError } = useJudgeAssignments();
  const [boardId, setBoardId] = useState<number | null>(boardIdParam ? Number(boardIdParam) : null);
  const { matrix, loading: matrixLoading, error: matrixError, refetch: refetchMatrix } = useScoreMatrix(boardId);
  const [cells, setCells] = useState<Record<CellKey, string>>({});
  const [feedbackByTeam, setFeedbackByTeam] = useState<Record<number, string>>({});
  const [expandedCriteriaId, setExpandedCriteriaId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!boardId && assignments.length > 0) {
      setBoardId(assignments[0].boardId);
    }
  }, [assignments, boardId]);

  useEffect(() => {
    if (!boardId) return;
    setSearchParams({ boardId: String(boardId) }, { replace: true });
  }, [boardId, setSearchParams]);

  useEffect(() => {
    if (!matrix) {
      setCells({});
      setFeedbackByTeam({});
      return;
    }
    setCells(buildCellMap(matrix));
    setFeedbackByTeam(
      Object.fromEntries(matrix.teams.map((row) => [row.teamId, row.generalFeedback ?? ""]))
    );
  }, [matrix]);

  const draftTeams = useMemo(
    () => matrix?.teams.filter((t) => t.editable) ?? [],
    [matrix]
  );

  const error = assignmentsError ?? matrixError ?? actionError;
  const loading = assignmentsLoading || (matrixLoading && !matrix);

  function setCell(teamId: number, criteriaId: number, value: string) {
    setCells((prev) => ({ ...prev, [cellKey(teamId, criteriaId)]: value }));
  }

  function buildSaveRows(teamIds?: number[]) {
    if (!matrix) return [];
    const idSet = teamIds ? new Set(teamIds) : null;
    return matrix.teams
      .filter((row) => row.editable && (!idSet || idSet.has(row.teamId)))
      .map((row) => ({
        teamId: row.teamId,
        generalFeedback: feedbackByTeam[row.teamId]?.trim() || undefined,
        scores: matrix.criteria
          .map((c) => {
            const raw = cells[cellKey(row.teamId, c.id)];
            if (raw === "" || raw == null) return null;
            const scoreValue = Number(raw);
            if (Number.isNaN(scoreValue)) return null;
            return { criteriaId: c.id, scoreValue };
          })
          .filter((s): s is { criteriaId: number; scoreValue: number } => s != null)
      }));
  }

  async function persistDraft(teamIds?: number[]) {
    if (!boardId || !matrix) return null;
    const rows = buildSaveRows(teamIds);
    if (!rows.length) return null;
    return saveScoreMatrix(boardId, { rows });
  }

  async function handleSave() {
    if (!boardId || !matrix) return;
    setSaving(true);
    setActionError(null);
    try {
      const result = await persistDraft();
      if (!result) {
        notify("Không có ô nháp để lưu.", "warning");
        return;
      }
      if (result.skippedSubmittedTeamIds?.length) {
        notify(`${result.skippedSubmittedTeamIds.length} đội đã nộp — bỏ qua khi lưu.`, "warning");
      }
      await invalidateAfterScoreMatrixMutation(queryClient, boardId);
      notify("Đã lưu nháp.", "success");
    } catch (err) {
      const msg = resolveApiError(err, "Lưu nháp thất bại.");
      setActionError(msg);
      notify(msg, "danger");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(submitAll: boolean, teamId?: number) {
    if (!boardId) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await persistDraft(teamId ? [teamId] : undefined);
      const result = await submitScoreMatrix(boardId, {
        submitAll,
        teamIds: teamId ? [teamId] : undefined
      });
      if (result.failed?.length) {
        const detail = result.failed
          .map((f) => `Đội #${f.teamId}: ${mapOrganizerErrorMessage(f.errorCode)}`)
          .join("; ");
        notify(`${result.failed.length} đội lỗi — ${detail}`, "warning");
      }
      if (result.submitted?.length) {
        notify(`Đã nộp ${result.submitted.length} phiếu chấm.`, "success");
      }
      await invalidateAfterScoreMatrixMutation(queryClient, boardId);
      await refetchMatrix();
    } catch (err) {
      const msg = resolveApiError(err, "Nộp phiếu thất bại.");
      setActionError(msg);
      notify(msg, "danger");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading && !matrix) return <ModuleSkeleton rows={6} />;

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Chấm điểm"
        title="Ma trận chấm điểm"
        description="Chấm tất cả đội trên bảng theo tiêu chí đã cấu hình. Lưu nháp trước khi nộp."
        actions={
          matrix ? (
            <Badge tone={draftTeams.length ? "warning" : "success"}>
              {matrix.summary.submittedCount}/{matrix.summary.teamCount} đã nộp
            </Badge>
          ) : null
        }
      />

      <WorkflowSteps
        title="Quy trình chấm"
        description="Chọn bảng rồi điền ma trận và nộp phiếu."
        steps={buildJudgeWorkflowSteps("scoring", assignments.length > 0)}
      />

      {matrix && draftTeams.length > 0 && matrix.summary.submittedCount < matrix.summary.teamCount ? (
        <div className="rounded-xl border border-warning-container bg-warning-container/25 p-md">
          <p className="font-body-sm text-on-surface">
            Còn {draftTeams.length} phiếu chưa nộp. Rubric có thể bị khóa sau khi BTC bắt đầu công bố
            kết quả — hãy hoàn tất và nộp phiếu sớm.
          </p>
        </div>
      ) : null}

      <section className="flex flex-wrap items-end gap-md rounded-xl border border-outline-variant bg-surface-container p-md">
        <label className="flex flex-col gap-1 font-label-sm text-on-surface-variant">
          Bảng được phân công
          <select
            className="min-w-[12rem] rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
            value={boardId ?? ""}
            onChange={(e) => setBoardId(e.target.value ? Number(e.target.value) : null)}
          >
            {assignments.length === 0 ? <option value="">Chưa có phân công</option> : null}
            {assignments.map((a) => (
              <option key={a.id} value={a.boardId}>
                Bảng #{a.boardId}
              </option>
            ))}
          </select>
        </label>
        {matrix ? (
          <p className="font-body-sm text-on-surface-variant">
            {matrix.board.roundName ?? `Vòng ${matrix.board.roundId}`} · {matrix.criteria.length} tiêu chí
          </p>
        ) : null}
      </section>

      {error ? (
        <div className="rounded-xl border border-error/40 bg-error-container/40 p-md">
          <p className="font-body-sm text-on-surface-variant">{error}</p>
        </div>
      ) : null}

      {!boardId || assignments.length === 0 ? (
        <EmptyState
          icon="gavel"
          title="Chưa có bảng để chấm"
          description="Ban tổ chức cần phân công giám khảo cho bảng."
          action={<ButtonLink to="/judge/dashboard" variant="secondary">Về dashboard</ButtonLink>}
        />
      ) : matrixLoading && !matrix ? (
        <ModuleSkeleton rows={4} />
      ) : !matrix ? (
        <ModuleSkeleton rows={4} />
      ) : matrix.criteria.length === 0 ? (
        <EmptyState
          icon="data_object"
          title="Chưa có tiêu chí chấm"
          description="Ban tổ chức cần cấu hình tiêu chí chấm cho vòng thi trước."
        />
      ) : (
        <>
          <section className="grid gap-md md:grid-cols-3">
            <StatCard label="Đội trên bảng" value={matrix.summary.teamCount} icon="groups" />
            <StatCard label="Nháp" value={matrix.summary.draftCount} icon="edit_note" tone="warning" />
            <StatCard label="Đã nộp" value={matrix.summary.submittedCount} icon="task_alt" tone="success" />
          </section>

          {expandedCriteriaId != null ? (
            <section className="rounded-xl border border-outline-variant bg-surface-container p-md">
              {(() => {
                const criterion = matrix.criteria.find((c) => c.id === expandedCriteriaId);
                if (!criterion) return null;
                return (
                  <>
                    <div className="mb-sm flex items-center justify-between">
                      <h3 className="font-title-sm text-on-surface">
                        {criterion.name}
                      </h3>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setExpandedCriteriaId(null)}>
                        Đóng
                      </Button>
                    </div>
                    <div className="grid gap-sm md:grid-cols-2">
                      {criterion.levelDescriptors?.map((level) => (
                        <div key={level.level} className="rounded-lg border border-outline-variant/60 p-sm">
                          <p className="font-label-sm text-on-surface">
                            {level.label} ({level.minScore}–{level.maxScore})
                          </p>
                          <p className="font-body-sm text-on-surface-variant">{level.description || "—"}</p>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </section>
          ) : null}

          <div className="flex flex-wrap gap-md">
            <Button type="button" variant="secondary" loading={saving} onClick={() => void handleSave()}>
              Lưu nháp
            </Button>
            <Button
              type="button"
              loading={submitting}
              disabled={draftTeams.length === 0}
              onClick={() => void handleSubmit(true)}
            >
              Nộp tất cả phiếu nháp
            </Button>
          </div>

          <section className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container">
            <table className="min-w-full text-left">
              <thead className="table-header-bg">
                <tr className="font-label-sm text-on-surface-variant">
                  <th className="sticky left-0 z-10 bg-surface-container-high px-md py-sm">Đội</th>
                  {matrix.criteria.map((c) => (
                    <th key={c.id} className="min-w-[5rem] px-sm py-sm" title={c.name}>
                      <button
                        type="button"
                        className="text-left font-label-sm text-primary hover:underline"
                        onClick={() => setExpandedCriteriaId(c.id)}
                      >
                        {c.code}
                      </button>
                      <span className="block font-body-sm text-on-surface-variant/80">{c.weight}%</span>
                    </th>
                  ))}
                  <th className="min-w-[8rem] px-md py-sm">Ghi chú</th>
                  <th className="px-md py-sm">Tổng</th>
                  <th className="px-md py-sm">TT</th>
                  <th className="px-md py-sm" />
                </tr>
              </thead>
              <tbody className="table-divider">
                {matrix.teams.map((row) => (
                  <tr
                    key={row.teamId}
                    className={`font-body-sm text-on-surface ${row.editable ? "bg-warning-container/15" : ""}`}
                  >
                    <td className="sticky left-0 z-10 bg-surface-container px-md py-sm">
                      <span className="font-label-md">{row.teamName}</span>
                      <span className="block text-on-surface-variant">Vị trí #{row.slotNumber}</span>
                      {row.repositoryUrl ? (
                        <a
                          href={row.repositoryUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 block truncate font-body-sm text-primary hover:underline"
                        >
                          Repository
                        </a>
                      ) : (
                        <span className="mt-1 block font-body-sm text-on-surface-variant">Chưa nộp repo</span>
                      )}
                    </td>
                    {matrix.criteria.map((c) => {
                      const key = cellKey(row.teamId, c.id);
                      return (
                        <td key={c.id} className="px-sm py-sm">
                          <input
                            type="number"
                            min={c.minScore}
                            max={c.maxScore}
                            step={0.1}
                            disabled={!row.editable}
                            className="w-16 rounded border border-outline-variant bg-surface px-2 py-1 text-center"
                            value={cells[key] ?? ""}
                            onChange={(e) => setCell(row.teamId, c.id, e.target.value)}
                          />
                        </td>
                      );
                    })}
                    <td className="px-md py-sm">
                      <textarea
                        className="min-h-[2.5rem] w-full min-w-[8rem] rounded border border-outline-variant bg-surface px-2 py-1 font-body-sm"
                        disabled={!row.editable}
                        placeholder="Tùy chọn"
                        value={feedbackByTeam[row.teamId] ?? ""}
                        onChange={(e) =>
                          setFeedbackByTeam((prev) => ({ ...prev, [row.teamId]: e.target.value }))
                        }
                      />
                    </td>
                    <td className="px-md py-sm font-label-md">
                      {row.computed?.judgeTeamScore != null
                        ? Number(row.computed.judgeTeamScore).toFixed(2)
                        : "—"}
                    </td>
                    <td className="px-md py-sm">
                      <Badge tone={row.status === "SUBMITTED" ? "success" : "warning"}>
                        {row.status === "SUBMITTED" ? "Đã nộp" : "Nháp"}
                      </Badge>
                    </td>
                    <td className="px-md py-sm">
                      {row.editable ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          loading={submitting}
                          onClick={() => void handleSubmit(false, row.teamId)}
                        >
                          Nộp
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}
