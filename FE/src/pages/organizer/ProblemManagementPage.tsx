import { useEffect, useState } from "react";
import { ConfirmAction } from "../../components/feedback/ConfirmAction";
import { useToast } from "../../components/feedback/ToastProvider";
import { Button, ButtonLink } from "../../components/ui/Button";
import { NextStepPanel } from "../../components/ui/NextStepPanel";
import { EmptyState } from "../../components/ui/EmptyState";
import { EventSelector } from "../../components/ui/EventSelector";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { WorkflowSteps } from "../../components/ui/WorkflowSteps";
import { problemFormSchema } from "../../domain/schemas";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useEventSetupProgress } from "../../hooks/useEventSetupProgress";
import { useProblemManagement } from "../../hooks/useProblemManagement";
import { resolveApiError } from "../../utils/apiError";
import { createIdempotencyKey } from "../../utils/idempotency";
import { zodFirstError } from "../../utils/formValidation";
import {
  createProblem,
  deleteProblem,
  updateProblem
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
  const { eventId, events, setEventId, loading: eventLoading } = useActiveEvent({ autoSelectFirst: true });
  const { steps: setupSteps } = useEventSetupProgress(eventId, "/organizer/problems");
  const {
    rounds,
    selectedRoundId,
    setSelectedRoundId,
    boards,
    boardId,
    setBoardId,
    problem,
    loading,
    error,
    invalidate
  } = useProblemManagement(eventId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [releaseAt, setReleaseAt] = useState("");
  const [closeAt, setCloseAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setTitle(problem?.title ?? "");
    setDescription(problem?.description ?? "");
    setReleaseAt(problem ? toLocalInput(problem.releaseAt) : "");
    setCloseAt(problem?.closeAt ? toLocalInput(problem.closeAt) : "");
  }, [problem]);

  async function handleDeleteProblem() {
    if (!problem) return;
    setDeleting(true);
    try {
      await deleteProblem(problem.id);
      await invalidate();
      notify("Đã xóa đề thi.", "success");
    } catch (err) {
      notify(resolveApiError(err, "Không xóa được đề thi."), "danger");
    } finally {
      setDeleting(false);
    }
  }

  async function saveDraft() {
    if (!boardId) return;
    const parsed = problemFormSchema.safeParse({ title, releaseAt, closeAt });
    if (!parsed.success) {
      notify(zodFirstError(parsed.error), "warning");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: parsed.data.title,
        description: description.trim() || undefined,
        releaseAt: toIsoFromLocal(parsed.data.releaseAt),
        closeAt: toIsoFromLocal(parsed.data.closeAt)
      };
      if (problem) {
        await updateProblem(problem.id, payload);
      } else {
        await createProblem(boardId, payload, createIdempotencyKey(`create-problem-${boardId}`));
      }
      await invalidate();
      notify(
        problem
          ? "Đã cập nhật đề thi."
          : "Đã tạo đề thi. Tiếp theo: gán mentor và giám khảo theo bảng.",
        "success"
      );
    } catch (err) {
      notify(resolveApiError(err, "Không lưu được đề thi."), "danger");
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
        description="Mỗi bảng một đề. Thí sinh xem được trong khoảng mở đề → đóng đề."
        actions={
          <EventSelector events={events} eventId={eventId} onChange={setEventId} />
        }
      />

      <WorkflowSteps
        title="Quy trình thiết lập"
        description="Cùng thứ tự với sidebar — trạng thái tính từ dữ liệu thật."
        steps={setupSteps}
        activeHref="/organizer/problems"
      />

      {error ? (
        <div className="rounded-xl border border-error/40 bg-error-container/40 p-md">
          <p className="font-body-sm text-on-surface">{error}</p>
        </div>
      ) : null}

      {boards.length === 0 ? (
        <EmptyState
          icon="grid_view"
          title="Chưa có bảng thi"
          description="Tạo vòng, bảng và gán đội trong mục Bảng thi trước khi cấu hình đề."
          action={
            <ButtonLink to="/organizer/boards" icon={null}>
              Đi tới Bảng thi
            </ButtonLink>
          }
        />
      ) : (
        <section className="grid gap-lg lg:grid-cols-[1fr_320px]">
          <form className="space-y-md rounded-xl border border-outline-variant bg-surface-container p-lg">
            {rounds.length > 1 ? (
              <label className="flex flex-col gap-xs">
                <span className="font-label-sm normal-case text-on-surface-variant">Vòng thi</span>
                <select
                  className="form-input"
                  value={selectedRoundId ?? ""}
                  onChange={(e) => setSelectedRoundId(Number(e.target.value))}
                >
                  {rounds.map((round) => (
                    <option key={round.id} value={round.id}>
                      {round.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
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
              <span className="font-label-sm normal-case text-on-surface-variant">Thời gian đóng đề</span>
              <input
                value={closeAt}
                onChange={(e) => setCloseAt(e.target.value)}
                className="form-input"
                type="datetime-local"
                data-testid="problem-close-at"
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
            <div className="flex flex-wrap gap-sm">
              <Button type="button" disabled={saving || deleting} onClick={() => void saveDraft()}>
                {saving ? "Đang lưu" : problem ? "Cập nhật đề" : "Tạo đề thi"}
              </Button>
              {problem ? (
                <ConfirmAction
                  title="Xóa đề thi?"
                  message={`Xóa đề «${problem.title}» trên bảng đang chọn. Thí sinh sẽ không xem được nội dung đề này nữa.`}
                  confirmLabel="Xóa đề"
                  onConfirm={() => void handleDeleteProblem()}
                >
                  <Button type="button" variant="danger" disabled={saving || deleting}>
                    {deleting ? "Đang xóa" : "Xóa đề"}
                  </Button>
                </ConfirmAction>
              ) : null}
            </div>
          </form>

          <aside className="rounded-xl border border-outline-variant bg-surface-container p-lg">
            <h2 className="font-headline-sm text-on-surface">Quy tắc cần giữ</h2>
            <div className="mt-md space-y-sm font-body-sm text-on-surface-variant">
              <p>Thí sinh chỉ xem đề từ lúc mở đến trước lúc đóng.</p>
              <p>Thời gian đóng phải sau thời gian mở.</p>
              <p>Check-in không được dùng để khóa đề thi.</p>
            </div>
          </aside>
        </section>
      )}

      {problem ? (
        <NextStepPanel
          variant="success"
          action={{
            title: "Bước tiếp: Phân công mentor & giám khảo",
            description: "Gán mentor và giám khảo theo bảng để họ có thể chấm sau khi mở đề.",
            to: "/organizer/assignments",
            cta: "Đi tới Phân công"
          }}
        />
      ) : boards.length > 0 ? (
        <NextStepPanel
          action={{
            title: "Bước tiếp: Lưu đề thi",
            description: "Nhập tên đề, thời gian mở/đóng đề và bấm «Tạo đề thi» hoặc «Cập nhật đề».",
            cta: "Điền form phía trên"
          }}
        />
      ) : null}
    </div>
  );
}
