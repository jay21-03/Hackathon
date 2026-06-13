import { useEffect, useMemo, useState } from "react";
import { SubmissionDetailModal } from "../../components/organizer/SubmissionDetailModal";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { OrganizerContextBar } from "../../components/ui/OrganizerContextBar";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { WorkflowSteps } from "../../components/ui/WorkflowSteps";
import { buildRankingWorkflowSteps } from "../../utils/rankingWorkflow";
import { StatCard } from "../../components/ui/StatCard";
import { useToast } from "../../components/feedback/ToastProvider";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useEventBoards } from "../../hooks/useEventBoards";
import { useEventSubmissions } from "../../hooks/useEventSubmissions";
import {
  fetchTeamSubmission,
  type AdminTeamSubmissionResponse
} from "../../services/submissionApi";
import { formatRepositoryTimestamp } from "../../services/repositoryProvisioningService";
import { resolveApiError } from "../../utils/apiError";
import { buildRoundNameById, formatBoardLabelById } from "../../utils/boardLabels";
import { resolveDefaultRoundId } from "../../utils/pickActiveRound";

type StatusFilter = "ALL" | "SUBMITTED" | "DRAFT" | "NONE";
type SortKey = "team" | "status" | "submittedAt";

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

function normalizeStatus(status: string | null | undefined): StatusFilter {
  if (status === "SUBMITTED" || status === "DRAFT") return status;
  return "NONE";
}

export function SubmissionManagementPage({ embedded = false }: { embedded?: boolean }) {
  const { notify } = useToast();
  const { eventId, loading: eventLoading } = useActiveEvent({ autoSelectFirst: true });
  const { rounds, boards, loading: boardsLoading, error: boardsError } = useEventBoards(eventId);
  const [roundId, setRoundId] = useState<number | null>(null);
  const [boardId, setBoardId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("team");
  const [listPage, setListPage] = useState(0);
  const [detailTeamId, setDetailTeamId] = useState<number | null>(null);
  const [detail, setDetail] = useState<AdminTeamSubmissionResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const activeRoundId = resolveDefaultRoundId(rounds, roundId);
  const roundNameById = useMemo(() => buildRoundNameById(rounds), [rounds]);

  const boardsInRound = useMemo(
    () => (activeRoundId != null ? boards.filter((b) => b.roundId === activeRoundId) : []),
    [boards, activeRoundId]
  );

  const { submissions, total, totalPages, loading, error } = useEventSubmissions(
    eventId,
    boardId,
    activeRoundId,
    listPage,
    25
  );

  useEffect(() => {
    setRoundId((prev) => resolveDefaultRoundId(rounds, prev));
  }, [rounds]);

  useEffect(() => {
    setBoardId((prev) => (prev && boardsInRound.some((b) => b.id === prev) ? prev : null));
  }, [boardsInRound, activeRoundId]);

  useEffect(() => {
    setListPage(0);
  }, [eventId, boardId, activeRoundId]);

  const filtered = useMemo(() => {
    const rows = submissions.filter((row) => {
      if (statusFilter === "ALL") return true;
      return normalizeStatus(row.status) === statusFilter;
    });
    return [...rows].sort((a, b) => {
      if (sortKey === "team") return a.teamName.localeCompare(b.teamName, "vi");
      if (sortKey === "status") return statusLabel(a.status).localeCompare(statusLabel(b.status), "vi");
      const at = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const bt = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return bt - at;
    });
  }, [submissions, statusFilter, sortKey]);

  const submittedCount = useMemo(
    () => submissions.filter((s) => s.status === "SUBMITTED").length,
    [submissions]
  );
  const draftCount = useMemo(
    () => submissions.filter((s) => s.status === "DRAFT").length,
    [submissions]
  );

  async function openDetail(row: AdminTeamSubmissionResponse) {
    setDetailTeamId(row.teamId);
    setDetail(row);
    setDetailLoading(true);
    try {
      const fetched = await fetchTeamSubmission(row.teamId, {
        boardId: row.boardId,
        roundId: activeRoundId
      });
      setDetail({
        ...row,
        ...fetched,
        boardId: fetched.boardId ?? row.boardId,
        boardName: fetched.boardName ?? row.boardName,
        slotNumber: fetched.slotNumber ?? row.slotNumber
      });
    } catch (err) {
      notify(resolveApiError(err, "Không tải được chi tiết bài nộp."), "danger");
      setDetailTeamId(null);
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    setDetailTeamId(null);
    setDetail(null);
  }

  const pageError = boardsError ?? error;
  const pageLoading = boardsLoading || loading;

  if (eventLoading) return <ModuleSkeleton rows={4} />;

  return (
    <div className="space-y-lg">
      {!embedded ? (
        <PageHeader
          eyebrow="Bài nộp"
          title="Theo dõi bài nộp đội"
          description="Xem link GitHub/GitLab mà các đội đã lưu nháp hoặc nộp chính thức."
          actions={
            <Badge tone={pageError ? "danger" : "success"}>
              {pageError ? "Lỗi tải dữ liệu" : `${total} đội trong vòng`}
            </Badge>
          }
        />
      ) : null}

      {!embedded ? (
        <WorkflowSteps
          title="Quy trình chấm & kết quả"
          description="Theo dõi bài nộp trước khi chấm và xếp hạng."
          steps={buildRankingWorkflowSteps("scoring")}
        />
      ) : null}

      <section className="flex flex-wrap items-end gap-md rounded-xl border border-outline-variant bg-surface-container p-md">
        {!embedded ? <OrganizerContextBar /> : null}
        {embedded ? (
          <Badge tone={pageError ? "danger" : "success"}>
            {pageError ? "Lỗi tải dữ liệu" : `${total} đội trong vòng`}
          </Badge>
        ) : null}
        <label className="flex flex-col gap-1 font-label-sm text-on-surface-variant">
          Vòng
          <select
            className="min-w-[12rem] rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
            value={activeRoundId ?? ""}
            onChange={(e) => setRoundId(e.target.value ? Number(e.target.value) : null)}
            disabled={!rounds.length}
          >
            {rounds.length === 0 ? <option value="">Chưa có vòng</option> : null}
            {rounds.map((round) => (
              <option key={round.id} value={round.id}>
                {round.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 font-label-sm text-on-surface-variant">
          Bảng
          <select
            className="min-w-[12rem] rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
            value={boardId ?? ""}
            onChange={(e) => setBoardId(e.target.value ? Number(e.target.value) : null)}
            disabled={!boardsInRound.length}
          >
            <option value="">Tất cả bảng vòng này</option>
            {boardsInRound.map((board) => (
              <option key={board.id} value={board.id}>
                {board.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 font-label-sm text-on-surface-variant">
          Trạng thái
          <select
            className="rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="ALL">Tất cả</option>
            <option value="SUBMITTED">Đã nộp</option>
            <option value="DRAFT">Bản nháp</option>
            <option value="NONE">Chưa nộp</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 font-label-sm text-on-surface-variant">
          Sắp xếp
          <select
            className="rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
          >
            <option value="team">Tên đội</option>
            <option value="status">Trạng thái</option>
            <option value="submittedAt">Thời gian nộp</option>
          </select>
        </label>
      </section>

      {pageError ? (
        <div className="rounded-xl border border-error/40 bg-error-container/40 p-md">
          <p className="font-body-sm text-on-surface-variant">{pageError}</p>
        </div>
      ) : null}

      <section className="grid gap-md md:grid-cols-3">
        <StatCard label="Đã nộp" value={submittedCount} helper="Bài đã gửi chính thức" icon="task_alt" tone="success" />
        <StatCard label="Bản nháp" value={draftCount} helper="Chưa nộp chính thức" icon="edit_note" tone="warning" />
        <StatCard
          label="Chưa nộp"
          value={submissions.length - submittedCount - draftCount}
          helper="Chưa có link repository"
          icon="link_off"
        />
      </section>

      {pageLoading ? (
        <ModuleSkeleton rows={5} />
      ) : filtered.length === 0 ? (
        <p className="font-body-sm text-on-surface-variant">
          Không có bài nộp phù hợp bộ lọc — kiểm tra phân bảng hoặc đổi trạng thái lọc.
        </p>
      ) : (
        <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="table-header-bg">
                <tr className="font-label-sm text-on-surface-variant">
                  <th className="px-md py-sm">Đội</th>
                  <th className="px-md py-sm">Vòng · Bảng</th>
                  <th className="px-md py-sm">Trạng thái</th>
                  <th className="px-md py-sm">Repository</th>
                  <th className="px-md py-sm">Nộp lúc</th>
                  <th className="px-md py-sm">Lần push cuối</th>
                  <th className="px-md py-sm">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="table-divider">
                {filtered.map((row) => (
                  <tr key={row.teamId} className="font-body-sm text-on-surface">
                    <td className="px-md py-md font-label-md">{row.teamName}</td>
                    <td className="px-md py-md">
                      {formatBoardLabelById(row.boardId, row.boardName, boards, roundNameById)}
                      {row.slotNumber != null ? (
                        <span className="ml-1 text-on-surface-variant">· Vị trí #{row.slotNumber}</span>
                      ) : null}
                    </td>
                    <td className="px-md py-md">
                      <Badge tone={statusTone(row.status)}>{statusLabel(row.status)}</Badge>
                    </td>
                    <td className="px-md py-md max-w-xs truncate">
                      {row.repositoryUrl ? (
                        <a
                          href={row.repositoryUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline-offset-2 hover:underline"
                        >
                          {row.repositoryName ?? row.repositoryUrl}
                        </a>
                      ) : (
                        <span className="text-on-surface-variant">—</span>
                      )}
                    </td>
                    <td className="px-md py-md text-on-surface-variant">
                      {row.submittedAt ? new Date(row.submittedAt).toLocaleString("vi-VN") : "—"}
                    </td>
                    <td className="px-md py-md text-on-surface-variant">
                      {formatRepositoryTimestamp(row.lastPushAt) ?? "—"}
                    </td>
                    <td className="px-md py-md">
                      <Button type="button" variant="ghost" onClick={() => void openDetail(row)}>
                        Xem
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-md rounded-xl border border-outline-variant bg-surface-container px-md py-sm">
          <p className="font-body-sm text-on-surface-variant">
            Trang {listPage + 1}/{totalPages} · {total} đội
          </p>
          <div className="flex gap-sm">
            <Button
              type="button"
              variant="ghost"
              disabled={listPage <= 0}
              onClick={() => setListPage((p) => Math.max(0, p - 1))}
            >
              Trước
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={listPage >= totalPages - 1}
              onClick={() => setListPage((p) => p + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      ) : null}

      <SubmissionDetailModal
        open={detailTeamId != null}
        loading={detailLoading}
        detail={detail}
        boardLabel={
          detail
            ? formatBoardLabelById(detail.boardId, detail.boardName, boards, roundNameById)
            : null
        }
        onClose={closeDetail}
      />
    </div>
  );
}
