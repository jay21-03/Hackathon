import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EventSelector } from "../../components/ui/EventSelector";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useEventRounds } from "../../hooks/useEventRounds";
import { useRubric } from "../../hooks/useRubric";
import { invalidateAfterRubricMutation } from "../../lib/invalidateScoringQueries";
import {
  createEmptyCriteria,
  saveRubric,
  type CriteriaRequestItem,
  type LevelDescriptor
} from "../../services/scoringApi";
import { getApiErrorMessage } from "../../utils/apiError";
import { mapOrganizerErrorMessage } from "../../utils/organizerErrors";

function toFormCriteria(items: CriteriaRequestItem[]): CriteriaRequestItem[] {
  return items.map((c, i) => ({
    ...c,
    sortOrder: c.sortOrder ?? i + 1,
    levelDescriptors: c.levelDescriptors?.length === 4
      ? c.levelDescriptors
      : createEmptyCriteria(i).levelDescriptors
  }));
}

function rubricToForm(criteria: CriteriaRequestItem[] | undefined): CriteriaRequestItem[] {
  if (!criteria?.length) {
    return [createEmptyCriteria(0), createEmptyCriteria(1), createEmptyCriteria(2)];
  }
  return toFormCriteria(criteria);
}

export function RubricSetupPage() {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const { eventId, events, setEventId, loading: eventLoading } = useActiveEvent({ autoSelectFirst: true });
  const { rounds, loading: roundsLoading, error: roundsError } = useEventRounds(eventId);
  const [roundId, setRoundId] = useState<number | null>(null);
  const activeRoundId =
    roundId != null && rounds.some((r) => r.id === roundId) ? roundId : null;
  const { rubric, loading: rubricLoading, error: rubricError } = useRubric(activeRoundId);
  const [criteria, setCriteria] = useState<CriteriaRequestItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  useEffect(() => {
    setRoundId(null);
  }, [eventId]);

  useEffect(() => {
    setRoundId((prev) => (prev && rounds.some((r) => r.id === prev) ? prev : rounds[0]?.id ?? null));
  }, [rounds]);

  useEffect(() => {
    if (!rubric || rubricLoading) return;
    setCriteria(
      rubric.criteria.length
        ? rubricToForm(
            rubric.criteria.map((c) => ({
              code: c.code,
              name: c.name,
              weight: Number(c.weight),
              minScore: Number(c.minScore),
              maxScore: Number(c.maxScore),
              description: c.description ?? "",
              sortOrder: c.sortOrder ?? undefined,
              levelDescriptors: c.levelDescriptors
            }))
          )
        : rubricToForm(undefined)
    );
  }, [rubric, rubricLoading, roundId]);

  const locked = rubric?.locked ?? false;
  const weightSum = useMemo(
    () => criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0),
    [criteria]
  );
  const error = roundsError ?? rubricError ?? saveError;
  const loading = roundsLoading || rubricLoading;

  function updateCriteria(index: number, patch: Partial<CriteriaRequestItem>) {
    setCriteria((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  function updateLevel(index: number, levelIndex: number, patch: Partial<LevelDescriptor>) {
    setCriteria((prev) =>
      prev.map((c, i) => {
        if (i !== index) return c;
        const levels = [...c.levelDescriptors];
        levels[levelIndex] = { ...levels[levelIndex], ...patch };
        return { ...c, levelDescriptors: levels };
      })
    );
  }

  async function handleSave() {
    if (!roundId) return;
    if (locked) {
      notify("Tiêu chí chấm đã khóa vì đã có phiếu chấm được nộp.", "warning");
      return;
    }
    if (weightSum !== 100) {
      const msg = "Tổng trọng số phải bằng 100% trước khi lưu.";
      setSaveError(msg);
      notify(msg, "warning");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await saveRubric(roundId, {
        criteria: criteria.map((c, i) => ({
          ...c,
          weight: Number(c.weight),
          minScore: Number(c.minScore),
          maxScore: Number(c.maxScore),
          sortOrder: i + 1
        })),
        replaceExisting: true
      });
      await invalidateAfterRubricMutation(queryClient, roundId);
      notify("Đã lưu tiêu chí chấm.", "success");
    } catch (err) {
      const msg = mapOrganizerErrorMessage(getApiErrorMessage(err, "Không lưu được tiêu chí chấm."));
      setSaveError(msg);
      notify(msg, "danger");
    } finally {
      setSaving(false);
    }
  }

  if (eventLoading) return <ModuleSkeleton rows={4} />;

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Chấm điểm"
        title="Tiêu chí chấm"
        description="Cấu hình tiêu chí và trọng số % cho từng vòng. Tổng trọng số phải bằng 100."
        actions={
          <Badge tone={locked ? "warning" : weightSum === 100 ? "success" : "danger"}>
            {locked ? "Đã khóa" : `Tổng trọng số: ${weightSum}%`}
          </Badge>
        }
      />

      <section className="flex flex-wrap items-end gap-md rounded-xl border border-outline-variant bg-surface-container p-md">
        <EventSelector events={events} eventId={eventId} onChange={setEventId} />
        <label className="flex flex-col gap-1 font-label-sm text-on-surface-variant">
          Vòng thi
          <select
            className="min-w-[12rem] rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
            value={roundId ?? ""}
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
      </section>

      {error ? (
        <div className="rounded-xl border border-error/40 bg-error-container/40 p-md">
          <p className="font-body-sm text-on-surface-variant">{error}</p>
        </div>
      ) : null}

      {loading ? (
        <ModuleSkeleton rows={5} />
      ) : !roundId ? (
        <p className="font-body-sm text-on-surface-variant">Tạo vòng thi trước khi cấu hình tiêu chí chấm.</p>
      ) : (
        <>
          {locked ? (
            <p className="rounded-lg border border-warning/30 bg-warning-container/30 px-md py-sm font-body-sm text-on-surface-variant">
              Tiêu chí chấm đã khóa vì có phiếu chấm đã nộp. Không thể chỉnh sửa.
            </p>
          ) : null}

          <section className="space-y-md">
            {criteria.map((item, index) => (
              <article
                key={`${item.code}-${index}`}
                className="rounded-xl border border-outline-variant bg-surface-container p-md"
              >
                <div className="mb-md flex flex-wrap items-center justify-between gap-sm">
                  <h3 className="font-title-sm text-on-surface">Tiêu chí #{index + 1}</h3>
                  <div className="flex gap-sm">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedCode(expandedCode === item.code ? null : item.code)}
                    >
                      {expandedCode === item.code ? "Ẩn mức điểm" : "Mức điểm"}
                    </Button>
                    {!locked && criteria.length > 1 ? (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => setCriteria((prev) => prev.filter((_, i) => i !== index))}
                      >
                        Xóa
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-md md:grid-cols-2 lg:grid-cols-6">
                  <label className="flex flex-col gap-1 font-label-sm text-on-surface-variant">
                    Mã
                    <input
                      className="rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
                      value={item.code}
                      disabled={locked}
                      onChange={(e) => updateCriteria(index, { code: e.target.value })}
                    />
                  </label>
                  <label className="flex flex-col gap-1 font-label-sm text-on-surface-variant lg:col-span-2">
                    Tên tiêu chí
                    <input
                      className="rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
                      value={item.name}
                      disabled={locked}
                      onChange={(e) => updateCriteria(index, { name: e.target.value })}
                    />
                  </label>
                  <label className="flex flex-col gap-1 font-label-sm text-on-surface-variant">
                    Trọng số (%)
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      className="rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
                      value={item.weight}
                      disabled={locked}
                      onChange={(e) => updateCriteria(index, { weight: Number(e.target.value) })}
                    />
                  </label>
                  <label className="flex flex-col gap-1 font-label-sm text-on-surface-variant">
                    Điểm min
                    <input
                      type="number"
                      step={0.1}
                      className="rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
                      value={item.minScore}
                      disabled={locked}
                      onChange={(e) => updateCriteria(index, { minScore: Number(e.target.value) })}
                    />
                  </label>
                  <label className="flex flex-col gap-1 font-label-sm text-on-surface-variant">
                    Điểm max
                    <input
                      type="number"
                      step={0.1}
                      className="rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
                      value={item.maxScore}
                      disabled={locked}
                      onChange={(e) => updateCriteria(index, { maxScore: Number(e.target.value) })}
                    />
                  </label>
                </div>

                <label className="mt-md flex flex-col gap-1 font-label-sm text-on-surface-variant">
                  Mô tả tiêu chí
                  <textarea
                    className="min-h-[3rem] rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
                    value={item.description ?? ""}
                    disabled={locked}
                    placeholder="Mô tả ngắn về tiêu chí (tùy chọn)"
                    onChange={(e) => updateCriteria(index, { description: e.target.value })}
                  />
                </label>

                {expandedCode === item.code ? (
                  <div className="mt-md grid gap-sm md:grid-cols-2">
                    {item.levelDescriptors.map((level, li) => (
                      <div
                        key={level.level}
                        className="rounded-lg border border-outline-variant/60 bg-surface p-sm"
                      >
                        <p className="mb-1 font-label-sm text-on-surface">{level.label}</p>
                        <textarea
                          className="min-h-[4rem] w-full rounded border border-outline-variant bg-surface-container px-2 py-1 font-body-sm"
                          value={level.description}
                          disabled={locked}
                          placeholder={`Mô tả ${level.label} (${level.minScore}–${level.maxScore})`}
                          onChange={(e) => updateLevel(index, li, { description: e.target.value })}
                        />
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </section>

          <div className="flex flex-wrap gap-md">
            {!locked ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCriteria((prev) => [...prev, createEmptyCriteria(prev.length)])}
              >
                Thêm tiêu chí
              </Button>
            ) : null}
            <Button type="button" loading={saving} disabled={locked || !criteria.length} onClick={() => void handleSave()}>
              Lưu tiêu chí
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
