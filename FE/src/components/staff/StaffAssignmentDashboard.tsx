import { useMemo, useState, type ReactNode } from "react";
import { Badge } from "../ui/Badge";
import { ButtonLink } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { ModuleSkeleton } from "../ui/ModuleSkeleton";
import { PageHeader } from "../ui/PageHeader";
import { StatCard } from "../ui/StatCard";
import { JudgeAssignmentsTable } from "../judge/JudgeAssignmentsTable";
import type { AssignmentResponse } from "../../services/assignmentService";
import { resolveApiError } from "../../utils/apiError";
import { formatBoardAssignmentShortLabel } from "../../utils/judgeAssignmentUtils";

interface StaffAssignmentDashboardProps {
  eyebrow: string;
  title: string;
  description: string;
  assignments: AssignmentResponse[];
  loading: boolean;
  error: unknown;
  workflow?: ReactNode;
  scorePath?: (boardId: number) => string;
  layout?: "cards" | "table";
  alwaysShowFilters?: boolean;
  emptyTitle: string;
  emptyDescription: string;
  boardFooter?: (assignment: AssignmentResponse) => ReactNode;
}

export function StaffAssignmentDashboard({
  eyebrow,
  title,
  description,
  assignments,
  loading,
  error,
  workflow,
  scorePath,
  layout = "cards",
  alwaysShowFilters = false,
  emptyTitle,
  emptyDescription,
  boardFooter
}: StaffAssignmentDashboardProps) {
  const allAssignments = assignments;
  const [eventFilter, setEventFilter] = useState<number | "">("");
  const [roundFilter, setRoundFilter] = useState<number | "">("");
  const [boardFilter, setBoardFilter] = useState<number | "">("");

  const eventOptions = useMemo(() => {
    const map = new Map<number, string>();
    for (const item of allAssignments) {
      if (item.eventId != null) {
        map.set(item.eventId, item.eventName ?? `Cuộc thi #${item.eventId}`);
      }
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [allAssignments]);

  const roundOptions = useMemo(() => {
    const map = new Map<number, string>();
    for (const item of allAssignments) {
      if (eventFilter !== "" && item.eventId !== eventFilter) continue;
      if (item.roundId != null) {
        map.set(item.roundId, item.roundName ?? `Vòng #${item.roundId}`);
      }
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [allAssignments, eventFilter]);

  const boardOptions = useMemo(() => {
    const map = new Map<number, string>();
    for (const item of allAssignments) {
      if (eventFilter !== "" && item.eventId !== eventFilter) continue;
      if (roundFilter !== "" && item.roundId !== roundFilter) continue;
      map.set(item.boardId, formatBoardAssignmentShortLabel(item));
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [allAssignments, eventFilter, roundFilter]);

  const showFilters = alwaysShowFilters
    ? allAssignments.length > 0
    : eventOptions.length > 1 || roundOptions.length > 1 || boardOptions.length > 1;

  const filtered = useMemo(
    () =>
      allAssignments.filter((item) => {
        if (eventFilter !== "" && item.eventId !== eventFilter) return false;
        if (roundFilter !== "" && item.roundId !== roundFilter) return false;
        if (boardFilter !== "" && item.boardId !== boardFilter) return false;
        return true;
      }),
    [allAssignments, eventFilter, roundFilter, boardFilter]
  );

  const errorMessage = error
    ? resolveApiError(error, "Không tải được danh sách phân công.")
    : null;

  if (loading) return <ModuleSkeleton rows={4} />;

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          <Badge tone={errorMessage ? "danger" : "success"}>
            {errorMessage ? "Lỗi tải dữ liệu" : "Đã cập nhật"}
          </Badge>
        }
      />

      {workflow}

      {showFilters ? (
        <div className="flex flex-wrap gap-md rounded-xl border border-outline-variant bg-surface-container p-md">
          <label className="flex min-w-[200px] flex-1 flex-col gap-1 font-label-sm text-on-surface-variant">
            Cuộc thi
            <select
              className="rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
              value={eventFilter}
              onChange={(e) => {
                setEventFilter(e.target.value ? Number(e.target.value) : "");
                setRoundFilter("");
                setBoardFilter("");
              }}
            >
              <option value="">Tất cả cuộc thi</option>
              {eventOptions.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[200px] flex-1 flex-col gap-1 font-label-sm text-on-surface-variant">
            Vòng
            <select
              className="rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
              value={roundFilter}
              onChange={(e) => {
                setRoundFilter(e.target.value ? Number(e.target.value) : "");
                setBoardFilter("");
              }}
            >
              <option value="">Tất cả vòng</option>
              {roundOptions.map((round) => (
                <option key={round.id} value={round.id}>
                  {round.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[200px] flex-1 flex-col gap-1 font-label-sm text-on-surface-variant">
            Bảng
            <select
              className="rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
              value={boardFilter}
              onChange={(e) => setBoardFilter(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">Tất cả bảng</option>
              {boardOptions.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.name}
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
          label="Phân công"
          value={filtered.length}
          helper="Bảng trong phạm vi lọc"
          icon="view_module"
        />
        <StatCard
          label="Cuộc thi"
          value={eventOptions.length}
          helper="Số cuộc thi có phân công"
          icon="emoji_events"
        />
      </section>

      {filtered.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} icon="view_module" />
      ) : layout === "table" && scorePath ? (
        <JudgeAssignmentsTable assignments={filtered} scorePath={scorePath} />
      ) : (
        <div className="grid gap-md md:grid-cols-2">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-outline-variant bg-surface-container p-md space-y-sm"
            >
              <h3 className="font-headline-sm text-on-surface">{item.boardName ?? `Bảng #${item.boardId}`}</h3>
              <p className="font-body-sm text-on-surface-variant">
                {item.eventName ?? "Cuộc thi"}
                {item.roundName ? ` · ${item.roundName}` : ""}
              </p>
              {scorePath ? (
                <ButtonLink to={scorePath(item.boardId)} variant="primary" size="sm">
                  Mở phiếu chấm
                </ButtonLink>
              ) : null}
              {boardFooter ? boardFooter(item) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
