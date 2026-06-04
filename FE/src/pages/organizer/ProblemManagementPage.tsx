import { useCallback, useEffect, useState } from "react";
import { useToast } from "../../components/feedback/ToastProvider";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { EventSelector } from "../../components/ui/EventSelector";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import {
  createProblem,
  fetchBoardProblems,
  fetchEventRounds,
  fetchRoundBoards,
  updateProblem,
  type BoardResponse,
  type ProblemResponse
} from "../../services/contestApi";

function toLocalInput(iso: string) {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIsoFromLocal(value: string) {
  return new Date(value).toISOString();
}

export function ProblemManagementPage() {
  const { notify } = useToast();
  const { eventId, events, setEventId, loading: eventLoading } = useActiveEvent();
  const [boards, setBoards] = useState<BoardResponse[]>([]);
  const [boardId, setBoardId] = useState<number | null>(null);
  const [problem, setProblem] = useState<ProblemResponse | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [releaseAt, setReleaseAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadBoards = useCallback(async () => {
    if (!eventId) {
      setBoards([]);
      setBoardId(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rounds = await fetchEventRounds(eventId);
      const round = rounds[0];
      if (!round) {
        setBoards([]);
        setBoardId(null);
        return;
      }
      const list = await fetchRoundBoards(round.id);
      setBoards(list);
      setBoardId((current) => current ?? list[0]?.id ?? null);
    } catch {
      notify("Không tải được danh sách bảng.", "danger");
    } finally {
      setLoading(false);
    }
  }, [eventId, notify]);

  useEffect(() => {
    void loadBoards();
  }, [loadBoards]);

  useEffect(() => {
    if (!boardId) {
      setProblem(null);
      setTitle("");
      setDescription("");
      setReleaseAt("");
      return;
    }
    let cancelled = false;
    fetchBoardProblems(boardId)
      .then((list) => {
        if (cancelled) return;
        const current = list[0] ?? null;
        setProblem(current);
        setTitle(current?.title ?? "");
        setDescription(current?.description ?? "");
        setReleaseAt(current ? toLocalInput(current.releaseAt) : "");
      })
      .catch(() => {
        if (!cancelled) notify("Không tải được đề thi.", "danger");
      });
    return () => {
      cancelled = true;
    };
  }, [boardId, notify]);

  async function saveDraft() {
    if (!boardId || !title.trim() || !releaseAt) {
      notify("Nhập tên đề và thời gian mở đề.", "warning");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        releaseAt: toIsoFromLocal(releaseAt)
      };
      const saved = problem
        ? await updateProblem(problem.id, payload)
        : await createProblem(boardId, payload);
      setProblem(saved);
      notify(problem ? "Đã cập nhật đề thi." : "Đã tạo đề thi.", "success");
    } catch {
      notify("Không lưu được đề thi.", "danger");
    } finally {
      setSaving(false);
    }
  }

  if (eventLoading || loading) {
    return <ModuleSkeleton rows={6} />;
  }

  if (!eventId) {
    return (
      <EmptyState
        icon="event"
        title="Chưa có cuộc thi"
        description="Tạo hoặc chọn cuộc thi trước khi cấu hình đề."
      />
    );
  }

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Cấu hình đề thi"
        title="Đề thi theo bảng"
        description="Moi bang co the co mot de rieng. Thí sinh chỉ xem được sau thời gian mở đề (cần API participant)."
        actions={
          <EventSelector events={events} eventId={eventId} onChange={setEventId} />
        }
      />

      {boards.length === 0 ? (
        <EmptyState
          icon="grid_view"
          title="Chưa có bảng thi"
          description="Tạo bảng trong mục Bảng chấm trước khi gán đề."
        />
      ) : (
        <section className="grid gap-lg lg:grid-cols-[1fr_320px]">
          <form className="space-y-md rounded-xl border border-outline-variant bg-surface-container p-lg">
            <label className="flex flex-col gap-xs">
              <span className="font-label-sm normal-case text-on-surface-variant">Bảng thi</span>
              <select
                className="form-input"
                value={boardId ?? ""}
                onChange={(e) => setBoardId(Number(e.target.value))}
              >
                {boards.map((board) => (
                  <option key={board.id} value={board.id}>
                    {board.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-xs">
              <span className="font-label-sm normal-case text-on-surface-variant">Tên đề thi</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="form-input" />
            </label>
            <label className="flex flex-col gap-xs">
              <span className="font-label-sm normal-case text-on-surface-variant">Thời gian mở đề</span>
              <input
                value={releaseAt}
                onChange={(e) => setReleaseAt(e.target.value)}
                className="form-input"
                type="datetime-local"
                data-testid="problem-release-at"
              />
            </label>
            <label className="flex flex-col gap-xs">
              <span className="font-label-sm normal-case text-on-surface-variant">Nội dung đề</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-input min-h-32"
              />
            </label>
            <Button type="button" disabled={saving} onClick={() => void saveDraft()}>
              {saving ? "Đang lưu" : problem ? "Cập nhật đề" : "Tạo đề thi"}
            </Button>
          </form>

          <aside className="rounded-xl border border-outline-variant bg-surface-container p-lg">
            <h2 className="font-headline-sm text-on-surface">Quy tắc cần giữ</h2>
            <div className="mt-md space-y-sm font-body-sm text-on-surface-variant">
              <p>Đề chỉ hiện sau thời gian mở đề.</p>
              <p>Check-in không được dùng để khóa đề thi.</p>
              <p>Thí sinh cần API GET /my/board và /problems (chưa có trên BE).</p>
            </div>
          </aside>
        </section>
      )}
    </div>
  );
}
