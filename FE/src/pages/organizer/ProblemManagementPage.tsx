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
      notify("Khong tai duoc danh sach bang.", "danger");
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
        if (!cancelled) notify("Khong tai duoc de thi.", "danger");
      });
    return () => {
      cancelled = true;
    };
  }, [boardId, notify]);

  async function saveDraft() {
    if (!boardId || !title.trim() || !releaseAt) {
      notify("Nhap ten de va thoi gian mo de.", "warning");
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
      notify(problem ? "Da cap nhat de thi." : "Da tao de thi.", "success");
    } catch {
      notify("Khong luu duoc de thi.", "danger");
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
        title="Chua co cuoc thi"
        description="Tao hoac chon cuoc thi truoc khi cau hinh de."
      />
    );
  }

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Cau hinh de thi"
        title="De thi theo bang"
        description="Moi bang co the co mot de rieng. Thi sinh chi xem duoc sau thoi gian mo de (can API participant)."
        actions={
          <EventSelector events={events} eventId={eventId} onChange={setEventId} />
        }
      />

      {boards.length === 0 ? (
        <EmptyState
          icon="grid_view"
          title="Chua co bang thi"
          description="Tao bang trong muc Bang cham truoc khi gan de."
        />
      ) : (
        <section className="grid gap-lg lg:grid-cols-[1fr_320px]">
          <form className="space-y-md rounded-xl border border-outline-variant bg-surface-container p-lg">
            <label className="flex flex-col gap-xs">
              <span className="font-label-sm normal-case text-on-surface-variant">Bang thi</span>
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
              <span className="font-label-sm normal-case text-on-surface-variant">Ten de thi</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="form-input" />
            </label>
            <label className="flex flex-col gap-xs">
              <span className="font-label-sm normal-case text-on-surface-variant">Thoi gian mo de</span>
              <input
                value={releaseAt}
                onChange={(e) => setReleaseAt(e.target.value)}
                className="form-input"
                type="datetime-local"
                data-testid="problem-release-at"
              />
            </label>
            <label className="flex flex-col gap-xs">
              <span className="font-label-sm normal-case text-on-surface-variant">Noi dung de</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-input min-h-32"
              />
            </label>
            <Button type="button" disabled={saving} onClick={() => void saveDraft()}>
              {saving ? "Dang luu" : problem ? "Cap nhat de" : "Tao de thi"}
            </Button>
          </form>

          <aside className="rounded-xl border border-outline-variant bg-surface-container p-lg">
            <h2 className="font-headline-sm text-on-surface">Quy tac can giu</h2>
            <div className="mt-md space-y-sm font-body-sm text-on-surface-variant">
              <p>De chi hien sau thoi gian mo de.</p>
              <p>Check-in khong duoc dung de khoa de thi.</p>
              <p>Thi sinh can API GET /my/board va /problems (chua co tren BE).</p>
            </div>
          </aside>
        </section>
      )}
    </div>
  );
}
