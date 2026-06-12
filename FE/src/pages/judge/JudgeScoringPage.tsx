import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "../../components/feedback/ToastProvider";
import { JudgeTeamListTable } from "../../components/judge/JudgeTeamListTable";
import { JudgeTeamScoringModal } from "../../components/judge/JudgeTeamScoringModal";
import { Badge } from "../../components/ui/Badge";
import { Button, ButtonLink } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { enableGithubProvisioning } from "../../config/features";
import { useJudgeAssignments } from "../../hooks/useJudgeAssignments";
import { useScoreMatrix } from "../../hooks/useScoreMatrix";
import { invalidateAfterScoreMatrixMutation } from "../../lib/invalidateScoringQueries";
import {
  fetchJudgeRepositoriesForRound,
  type JudgeRepositoryResponse
} from "../../services/judgeRepositoryService";
import {
  saveScoreMatrix,
  submitScoreMatrix,
  type ScoreMatrixResponse
} from "../../services/scoringApi";
import {
  excludeArchivedTermJudgeAssignments,
  formatBoardAssignmentShortLabel,
  groupAssignmentsByEvent,
  pickPriorityJudgeAssignment,
  readinessLabel,
  readinessTone
} from "../../utils/judgeAssignmentUtils";
import { validateTeamScoresForDraft, validateTeamScoresForSubmit } from "../../domain/schemas";
import { applyApiFormErrors, resolveApiError } from "../../utils/apiError";
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
  const { assignments: allAssignments, loading: assignmentsLoading, error: assignmentsError } =
    useJudgeAssignments();
  const assignments = useMemo(
    () => excludeArchivedTermJudgeAssignments(allAssignments),
    [allAssignments]
  );
  const [boardId, setBoardId] = useState<number | null>(boardIdParam ? Number(boardIdParam) : null);
  const { matrix, loading: matrixLoading, error: matrixError, refetch: refetchMatrix } = useScoreMatrix(boardId);
  const [cells, setCells] = useState<Record<CellKey, string>>({});
  const [feedbackByTeam, setFeedbackByTeam] = useState<Record<number, string>>({});
  const [scoringTeamId, setScoringTeamId] = useState<number | null>(null);
  const [expandedCriteriaId, setExpandedCriteriaId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const selectedAssignment = useMemo(
    () => assignments.find((item) => item.boardId === boardId) ?? null,
    [assignments, boardId]
  );

  const reposQuery = useQuery({
    queryKey: ["judge", "repositories", selectedAssignment?.roundId, boardId],
    queryFn: () => fetchJudgeRepositoriesForRound(selectedAssignment!.roundId!),
    enabled: enableGithubProvisioning && selectedAssignment?.roundId != null
  });

  const repoByTeamId = useMemo(() => {
    const map = new Map<number, JudgeRepositoryResponse>();
    for (const repo of reposQuery.data ?? []) {
      if (boardId != null && repo.boardId !== boardId) continue;
      map.set(repo.teamId, repo);
    }
    return map;
  }, [reposQuery.data, boardId]);

  const groupedAssignments = useMemo(
    () => groupAssignmentsByEvent(assignments),
    [assignments]
  );

  useEffect(() => {
    if (assignments.length === 0) return;
    const paramId = boardIdParam ? Number(boardIdParam) : null;
    const validParam =
      paramId != null && Number.isFinite(paramId) && assignments.some((a) => a.boardId === paramId)
        ? paramId
        : null;
    const nextId =
      validParam ?? pickPriorityJudgeAssignment(assignments, boardId)?.boardId ?? null;
    if (nextId != null && nextId !== boardId) {
      setBoardId(nextId);
    }
  }, [assignments, boardIdParam, boardId]);

  useEffect(() => {
    if (!boardId) return;
    setSearchParams({ boardId: String(boardId) }, { replace: true });
    setScoringTeamId(null);
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

  const unsubmittedTeams = useMemo(
    () => matrix?.teams.filter((t) => t.status === "DRAFT") ?? [],
    [matrix]
  );

  const scoringTeam = useMemo(
    () => matrix?.teams.find((row) => row.teamId === scoringTeamId) ?? null,
    [matrix, scoringTeamId]
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
      .filter((row) => (!idSet || idSet.has(row.teamId)))
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

  function validateDraftForTeams(teamIds: number[]): string | null {
    if (!matrix) return "Chưa có dữ liệu chấm điểm.";
    const criteria = matrix.criteria.map((c) => ({
      id: c.id,
      name: c.name,
      minScore: Number(c.minScore),
      maxScore: Number(c.maxScore)
    }));
    for (const id of teamIds) {
      const error = validateTeamScoresForDraft(id, criteria, cells);
      if (error) {
        const team = matrix.teams.find((row) => row.teamId === id);
        return team ? `${team.teamName}: ${error}` : error;
      }
    }
    return null;
  }

  async function persistDraft(teamIds?: number[]) {
    if (!boardId || !matrix) return null;
    const rows = buildSaveRows(teamIds);
    if (!rows.length) return null;
    return saveScoreMatrix(boardId, { rows });
  }

  async function handleSaveAll() {
    if (!boardId || !matrix) return;
    const teamIds = matrix.teams.map((row) => row.teamId);
    const validationError = validateDraftForTeams(teamIds);
    if (validationError) {
      setActionError(validationError);
      notify(validationError, "warning");
      return;
    }
    setSaving(true);
    setActionError(null);
    try {
      const result = await persistDraft();
      if (!result) {
        notify("Không có ô nháp để lưu.", "warning");
        return;
      }
      await invalidateAfterScoreMatrixMutation(queryClient, boardId);
      notify("Đã lưu điểm.", "success");
    } catch (err) {
      let msg = resolveApiError(err, "Lưu nháp thất bại.");
      applyApiFormErrors(err, (errors) => {
        const first = Object.values(errors)[0];
        if (first) msg = first;
      });
      setActionError(msg);
      notify(msg, "danger");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveTeam(teamId: number) {
    if (!boardId) return;
    const validationError = validateDraftForTeams([teamId]);
    if (validationError) {
      setActionError(validationError);
      notify(validationError, "warning");
      return;
    }
    setSaving(true);
    setActionError(null);
    try {
      await persistDraft([teamId]);
      await invalidateAfterScoreMatrixMutation(queryClient, boardId);
      await refetchMatrix();
      notify("Đã lưu điểm.", "success");
    } catch (err) {
      let msg = resolveApiError(err, "Lưu điểm thất bại.");
      applyApiFormErrors(err, (errors) => {
        const first = Object.values(errors)[0];
        if (first) msg = first;
      });
      setActionError(msg);
      notify(msg, "danger");
    } finally {
      setSaving(false);
    }
  }

  function validateBeforeSubmit(teamIds: number[]): string | null {
    if (!matrix) return "Chưa có dữ liệu chấm điểm.";
    const criteria = matrix.criteria.map((c) => ({
      id: c.id,
      name: c.name,
      minScore: Number(c.minScore),
      maxScore: Number(c.maxScore)
    }));
    for (const id of teamIds) {
      const error = validateTeamScoresForSubmit(id, criteria, cells);
      if (error) {
        const team = matrix.teams.find((row) => row.teamId === id);
        return team ? `${team.teamName}: ${error}` : error;
      }
    }
    return null;
  }

  async function handleSubmit(submitAll: boolean, teamId?: number) {
    if (!boardId || !matrix) return;
    const targetTeamIds = teamId
      ? [teamId]
      : submitAll
        ? unsubmittedTeams.map((t) => t.teamId)
        : [];
    const validationError = validateBeforeSubmit(targetTeamIds);
    if (validationError) {
      setActionError(validationError);
      notify(validationError, "warning");
      return;
    }
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
        const teamRow = teamId ? matrix?.teams.find((row) => row.teamId === teamId) : null;
        if (teamId && teamRow?.status === "SUBMITTED") {
          notify("Đã cập nhật phiếu chấm.", "success");
        } else if (teamId) {
          notify("Đã nộp phiếu chấm.", "success");
        } else {
          notify(`Đã nộp ${result.submitted.length} phiếu chấm.`, "success");
        }
      }
      await invalidateAfterScoreMatrixMutation(queryClient, boardId);
      await refetchMatrix();
      if (teamId) setScoringTeamId(null);
    } catch (err) {
      let msg = resolveApiError(err, "Nộp phiếu thất bại.");
      applyApiFormErrors(err, (errors) => {
        const first = Object.values(errors)[0];
        if (first) msg = first;
      });
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
        title="Danh sách đội"
        description="Chọn đội và bấm Chấm điểm để mở phiếu chấm, xem repository và nộp kết quả."
        actions={
          matrix ? (
            <Badge tone={unsubmittedTeams.length ? "warning" : "success"}>
              {matrix.summary.submittedCount}/{matrix.summary.teamCount} đã nộp
            </Badge>
          ) : null
        }
      />

      {matrix && unsubmittedTeams.length > 0 ? (
        <div className="rounded-xl border border-warning-container bg-warning-container/25 p-md">
          <p className="font-body-sm text-on-surface">
            Còn {unsubmittedTeams.length} phiếu chưa nộp. Rubric có thể bị khóa sau khi BTC bắt đầu công bố
            kết quả — hãy hoàn tất và nộp phiếu sớm. Phiếu đã nộp vẫn có thể cập nhật lại.
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
            {groupedAssignments.map((group) => (
              <optgroup key={group.eventName} label={group.eventName}>
                {group.items.map((assignment) => (
                  <option key={assignment.id} value={assignment.boardId}>
                    {formatBoardAssignmentShortLabel(assignment)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        {selectedAssignment?.readiness ? (
          <Badge tone={readinessTone(selectedAssignment.readiness)}>
            {readinessLabel(selectedAssignment.readiness)}
          </Badge>
        ) : null}
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

          {matrix.teams.length > 0 ? (
            <div className="flex flex-wrap gap-md">
              <Button type="button" variant="secondary" loading={saving} onClick={() => void handleSaveAll()}>
                Lưu tất cả
              </Button>
              {unsubmittedTeams.length > 0 ? (
                <Button
                  type="button"
                  loading={submitting}
                  onClick={() => void handleSubmit(true)}
                >
                  Nộp tất cả phiếu nháp
                </Button>
              ) : null}
            </div>
          ) : null}

          <JudgeTeamListTable
            teams={matrix.teams}
            criteriaCount={matrix.criteria.length}
            onScoreTeam={setScoringTeamId}
          />

          <JudgeTeamScoringModal
            open={scoringTeamId != null}
            team={scoringTeam}
            criteria={matrix.criteria}
            cells={cells}
            feedback={scoringTeam ? (feedbackByTeam[scoringTeam.teamId] ?? "") : ""}
            repository={scoringTeam ? (repoByTeamId.get(scoringTeam.teamId) ?? null) : null}
            saving={saving}
            submitting={submitting}
            expandedCriteriaId={expandedCriteriaId}
            onClose={() => setScoringTeamId(null)}
            onCellChange={(criteriaId, value) => {
              if (!scoringTeam) return;
              setCell(scoringTeam.teamId, criteriaId, value);
            }}
            onFeedbackChange={(value) => {
              if (!scoringTeam) return;
              setFeedbackByTeam((prev) => ({ ...prev, [scoringTeam.teamId]: value }));
            }}
            onToggleCriteria={setExpandedCriteriaId}
            onSave={() => {
              if (!scoringTeam) return;
              void handleSaveTeam(scoringTeam.teamId);
            }}
            onSubmit={() => {
              if (!scoringTeam) return;
              void handleSubmit(false, scoringTeam.teamId);
            }}
          />
        </>
      )}
    </div>
  );
}
