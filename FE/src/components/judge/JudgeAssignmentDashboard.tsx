import { useEffect, useMemo, useState } from "react";
import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";
import { ModuleSkeleton } from "../ui/ModuleSkeleton";
import { PageHeader } from "../ui/PageHeader";
import { StatCard } from "../ui/StatCard";
import { JudgeAssignmentsTable } from "./JudgeAssignmentsTable";
import type { AssignmentResponse } from "../../services/assignmentService";
import { resolveApiError } from "../../utils/apiError";
import {
  listActiveJudgeEvents,
  partitionJudgeAssignments,
  sortAssignmentsByPriority
} from "../../utils/judgeAssignmentUtils";

type JudgeDashboardTab = "todo" | "done";

interface JudgeAssignmentDashboardProps {
  assignments: AssignmentResponse[];
  loading: boolean;
  error: unknown;
  scorePath: (boardId: number) => string;
}

export function JudgeAssignmentDashboard({
  assignments,
  loading,
  error,
  scorePath
}: JudgeAssignmentDashboardProps) {
  const [tab, setTab] = useState<JudgeDashboardTab>("todo");
  const [eventFilter, setEventFilter] = useState<number | "">("");
  const [roundFilter, setRoundFilter] = useState<number | "">("");

  const activeEvents = useMemo(() => listActiveJudgeEvents(assignments), [assignments]);
  const showEventContextBar = activeEvents.length > 1;

  const { todo, done } = useMemo(() => partitionJudgeAssignments(assignments), [assignments]);
  const tabAssignments = tab === "todo" ? todo : done;

  useEffect(() => {
    if (activeEvents.length === 1) {
      setEventFilter(activeEvents[0]!.id);
      return;
    }
    setEventFilter((prev) =>
      prev !== "" && activeEvents.some((event) => event.id === prev) ? prev : ""
    );
  }, [activeEvents]);

  const scopedAssignments = useMemo(() => {
    return tabAssignments.filter((item) => {
      if (eventFilter !== "" && item.eventId !== eventFilter) return false;
      if (roundFilter !== "" && item.roundId !== roundFilter) return false;
      return true;
    });
  }, [tabAssignments, eventFilter, roundFilter]);

  const sortedAssignments = useMemo(
    () => sortAssignmentsByPriority(scopedAssignments),
    [scopedAssignments]
  );

  const roundOptions = useMemo(() => {
    const map = new Map<number, string>();
    for (const item of tabAssignments) {
      if (eventFilter !== "" && item.eventId !== eventFilter) continue;
      if (item.roundId != null) {
        map.set(item.roundId, item.roundName ?? `Vòng #${item.roundId}`);
      }
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [tabAssignments, eventFilter]);

  const showRoundFilter = roundOptions.length > 1;

  const errorMessage = error
    ? resolveApiError(error, "Không tải được danh sách phân công.")
    : null;

  if (loading) return <ModuleSkeleton rows={4} />;

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Giám khảo"
        title="Bảng cần chấm"
        description="Danh sách bảng được phân công — ưu tiên việc chưa hoàn tất. Mở phiếu chấm trực tiếp từ bảng."
        actions={
          <Badge tone={errorMessage ? "danger" : "success"}>
            {errorMessage ? "Lỗi tải dữ liệu" : "Đã cập nhật"}
          </Badge>
        }
      />

      <div className="flex flex-wrap gap-xs">
        <button
          type="button"
          onClick={() => setTab("todo")}
          className={`rounded-full border px-4 py-2 font-label-sm transition ${
            tab === "todo"
              ? "border-primary bg-primary-container text-on-primary-container"
              : "border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          Cần chấm ({todo.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("done")}
          className={`rounded-full border px-4 py-2 font-label-sm transition ${
            tab === "done"
              ? "border-primary bg-primary-container text-on-primary-container"
              : "border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          Đã xong ({done.length})
        </button>
      </div>

      {showEventContextBar ? (
        <div className="flex flex-wrap items-end gap-md rounded-xl border border-outline-variant bg-surface-container p-md">
          <label className="flex min-w-[220px] flex-1 flex-col gap-1 font-label-sm text-on-surface-variant">
            Cuộc thi đang cần chấm
            <select
              className="rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
              value={eventFilter}
              onChange={(e) => {
                setEventFilter(e.target.value ? Number(e.target.value) : "");
                setRoundFilter("");
              }}
            >
              <option value="">Tất cả cuộc thi</option>
              {activeEvents.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </label>
          {showRoundFilter ? (
            <label className="flex min-w-[200px] flex-1 flex-col gap-1 font-label-sm text-on-surface-variant">
              Vòng
              <select
                className="rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
                value={roundFilter}
                onChange={(e) => setRoundFilter(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">Tất cả vòng</option>
                {roundOptions.map((round) => (
                  <option key={round.id} value={round.id}>
                    {round.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      ) : showRoundFilter ? (
        <div className="flex flex-wrap gap-md rounded-xl border border-outline-variant bg-surface-container p-md">
          <label className="flex min-w-[200px] flex-col gap-1 font-label-sm text-on-surface-variant">
            Vòng
            <select
              className="rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
              value={roundFilter}
              onChange={(e) => setRoundFilter(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">Tất cả vòng</option>
              {roundOptions.map((round) => (
                <option key={round.id} value={round.id}>
                  {round.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-xl border border-error/40 bg-error-container/40 p-md">
          <p className="font-body-sm text-on-surface-variant">{errorMessage}</p>
        </div>
      ) : null}

      <section className="grid gap-md md:grid-cols-2">
        <StatCard
          label={tab === "todo" ? "Cần chấm" : "Đã xong"}
          value={sortedAssignments.length}
          helper="Bảng trong phạm vi lọc"
          icon="view_module"
        />
        <StatCard
          label="Cuộc thi"
          value={activeEvents.length || new Set(assignments.map((a) => a.eventId).filter(Boolean)).size}
          helper="Cuộc thi có phân công"
          icon="emoji_events"
        />
      </section>

      {assignments.length === 0 ? (
        <EmptyState
          title="Chưa có phân công"
          description="Ban tổ chức sẽ gán giám khảo cho bảng tại trang Phân công."
          icon="view_module"
        />
      ) : sortedAssignments.length === 0 ? (
        <EmptyState
          title={tab === "todo" ? "Không còn bảng cần chấm" : "Chưa có bảng đã hoàn tất"}
          description={
            tab === "todo"
              ? "Tất cả phiếu chấm đã nộp đủ — xem tab Đã xong."
              : "Các bảng hoàn tất chấm sẽ xuất hiện ở đây."
          }
          icon="task_alt"
        />
      ) : (
        <JudgeAssignmentsTable assignments={sortedAssignments} scorePath={scorePath} />
      )}
    </div>
  );
}
