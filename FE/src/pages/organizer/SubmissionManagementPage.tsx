import { useEffect, useMemo, useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EventSelector } from "../../components/ui/EventSelector";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { useToast } from "../../components/feedback/ToastProvider";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useEventBoards } from "../../hooks/useEventBoards";
import { useEventSubmissions } from "../../hooks/useEventSubmissions";
import {
  fetchTeamSubmission,
  type AdminTeamSubmissionResponse
} from "../../services/submissionApi";
import { getApiErrorMessage } from "../../utils/apiError";

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

export function SubmissionManagementPage() {
  const { notify } = useToast();
  const { eventId, events, setEventId, loading: eventLoading } = useActiveEvent({ autoSelectFirst: true });
  const { boards, loading: boardsLoading, error: boardsError } = useEventBoards(eventId);
  const [boardId, setBoardId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("team");
  const [detail, setDetail] = useState<AdminTeamSubmissionResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const { submissions, loading, error } = useEventSubmissions(eventId, boardId);

  useEffect(() => {
    setBoardId((prev) => (prev && boards.some((b) => b.id === prev) ? prev : null));
  }, [boards, eventId]);

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

  async function openDetail(teamId: number) {
    setDetailLoading(true);
    setDetail(null);
    try {
      const row = await fetchTeamSubmission(teamId);
      setDetail(row);
    } catch (err) {
      notify(getApiErrorMessage(err, "Không tải được chi tiết bài nộp."), "danger");
    } finally {
      setDetailLoading(false);
    }
  }

  const pageError = boardsError ?? error;
  const pageLoading = boardsLoading || loading;

  if (eventLoading) return <ModuleSkeleton rows={4} />;

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Bài nộp"
        title="Theo dõi bài nộp đội"
        description="Xem link GitHub/GitLab mà các đội đã lưu nháp hoặc nộp chính thức."
        actions={
          <Badge tone={pageError ? "danger" : "success"}>
            {pageError ? "Lỗi tải dữ liệu" : `${submissions.length} đội trên bảng`}
          </Badge>
        }
      />

      <section className="flex flex-wrap items-end gap-md rounded-xl border border-outline-variant bg-surface-container p-md">
        <EventSelector events={events} eventId={eventId} onChange={setEventId} />
        <label className="flex flex-col gap-1 font-label-sm text-on-surface-variant">
          Lọc theo bảng
          <select
            className="min-w-[12rem] rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
            value={boardId ?? ""}
            onChange={(e) => setBoardId(e.target.value ? Number(e.target.value) : null)}
            disabled={!boards.length}
          >
            <option value="">Tất cả bảng</option>
            {boards.map((board) => (
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
        <StatCard label="Đã nộp" value={submittedCount} helper="Trạng thái SUBMITTED" icon="task_alt" tone="success" />
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
                  <th className="px-md py-sm">Bảng</th>
                  <th className="px-md py-sm">Trạng thái</th>
                  <th className="px-md py-sm">Repository</th>
                  <th className="px-md py-sm">Nộp lúc</th>
                  <th className="px-md py-sm">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="table-divider">
                {filtered.map((row) => (
                  <tr key={row.teamId} className="font-body-sm text-on-surface">
                    <td className="px-md py-md font-label-md">{row.teamName}</td>
                    <td className="px-md py-md">
                      {row.boardName ?? (row.boardId ? `Bảng #${row.boardId}` : "—")}
                      {row.slotNumber != null ? (
                        <span className="ml-1 text-on-surface-variant">· Slot {row.slotNumber}</span>
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
                    <td className="px-md py-md">
                      <Button type="button" variant="ghost" onClick={() => void openDetail(row.teamId)}>
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

      {detailLoading ? <ModuleSkeleton rows={2} /> : null}
      {detail ? (
        <section className="rounded-xl border border-outline-variant bg-surface-container p-md space-y-sm">
          <h2 className="font-headline-sm text-on-surface">Chi tiết — {detail.teamName}</h2>
          <p className="font-body-sm text-on-surface-variant">
            Bảng: {detail.boardName ?? "—"}
            {detail.slotNumber != null ? ` · Slot ${detail.slotNumber}` : ""}
          </p>
          <p className="font-body-sm">
            Trạng thái: <Badge tone={statusTone(detail.status)}>{statusLabel(detail.status)}</Badge>
          </p>
          {detail.repositoryUrl ? (
            <p className="font-body-sm">
              Repository:{" "}
              <a href={detail.repositoryUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                {detail.repositoryName ?? detail.repositoryUrl}
              </a>
            </p>
          ) : null}
          <Button type="button" variant="ghost" onClick={() => setDetail(null)}>
            Đóng
          </Button>
        </section>
      ) : null}
    </div>
  );
}
