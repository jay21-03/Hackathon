import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../components/feedback/ToastProvider";
import { RetryPanel } from "../../components/feedback/RetryPanel";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { OrganizerContextBar } from "../../components/ui/OrganizerContextBar";
import { EmptyState } from "../../components/ui/EmptyState";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { WorkflowSteps } from "../../components/ui/WorkflowSteps";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useEventSetupProgress } from "../../hooks/useEventSetupProgress";
import { buildRankingWorkflowSteps } from "../../utils/rankingWorkflow";
import { useEventRounds } from "../../hooks/useEventRounds";
import { useRubric } from "../../hooks/useRubric";
import { invalidateAfterRubricMutation } from "../../lib/invalidateScoringQueries";
import { queryKeys } from "../../lib/queryKeys";
import {
  createDefaultHackathonRubric,
  createEmptyCriteria,
  deriveCriteriaScoreRange,
  enrichHackathonRubricCriteria,
  normalizeLevelDescriptors,
  saveRubric,
  fetchRubric,
  type CriteriaRequestItem,
  type LevelDescriptor
} from "../../services/scoringApi";
import { validateRubricCriteria } from "../../domain/schemas";
import { applyApiFormErrors, resolveApiError } from "../../utils/apiError";
import { resolveDefaultRoundId } from "../../utils/pickActiveRound";
import {
  applyCriteriaTemplate,
  fetchCriteriaTemplates
} from "../../services/criteriaTemplateApi";

function toFormCriteria(items: CriteriaRequestItem[]): CriteriaRequestItem[] {
  return items.map((c, i) => {
    const levelDescriptors = normalizeLevelDescriptors(c.levelDescriptors);
    const enriched = enrichHackathonRubricCriteria({
      ...c,
      sortOrder: c.sortOrder ?? i + 1,
      levelDescriptors
    });
    return {
      ...enriched,
      ...deriveCriteriaScoreRange(enriched.levelDescriptors)
    };
  });
}

function rubricToForm(criteria: CriteriaRequestItem[] | undefined): CriteriaRequestItem[] {
  if (!criteria?.length) {
    return createDefaultHackathonRubric();
  }
  return toFormCriteria(criteria);
}

export function RubricSetupPage({ embedded = false }: { embedded?: boolean } = {}) {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const { eventId, loading: eventLoading } = useActiveEvent({ autoSelectFirst: true });
  const { steps: setupSteps, context: setupContext, loading: setupLoading } = useEventSetupProgress(
    eventId,
    "/organizer/rubric"
  );
  const { rounds, loading: roundsLoading, error: roundsError, refetch: refetchRounds } = useEventRounds(eventId);
  const [roundId, setRoundId] = useState<number | null>(null);
  const activeRoundId = resolveDefaultRoundId(rounds, roundId);
  const { rubric, loading: rubricLoading, error: rubricError, refetch: refetchRubric } = useRubric(activeRoundId);
  const [criteria, setCriteria] = useState<CriteriaRequestItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [templateActionId, setTemplateActionId] = useState<number | null>(null);
  const [copySourceRoundId, setCopySourceRoundId] = useState<number | null>(null);
  const [inheritBusyIndex, setInheritBusyIndex] = useState<number | null>(null);
  const [inheritSourceByIndex, setInheritSourceByIndex] = useState<Record<number, number>>({});

  const sourceRubricQuery = useQuery({
    queryKey: queryKeys.scoring.rubric(copySourceRoundId),
    queryFn: () => fetchRubric(copySourceRoundId!),
    enabled: copySourceRoundId != null
  });

  const templatesQuery = useQuery({
    queryKey: ["criteria-templates"],
    queryFn: fetchCriteriaTemplates
  });

  useEffect(() => {
    setRoundId(null);
  }, [eventId]);

  useEffect(() => {
    setRoundId((prev) => resolveDefaultRoundId(rounds, prev));
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
  const loadError = roundsError ?? rubricError;
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
        const range = deriveCriteriaScoreRange(levels);
        return { ...c, levelDescriptors: levels, ...range };
      })
    );
  }

  async function inheritCriterionAt(index: number) {
    if (!copySourceRoundId) {
      notify("Chọn vòng nguồn để kế thừa tiêu chí.", "warning");
      return;
    }
    setInheritBusyIndex(index);
    try {
      const sourceRubric =
        sourceRubricQuery.data ?? (await fetchRubric(copySourceRoundId));
      const sourceIndex = inheritSourceByIndex[index] ?? index;
      const sourceItem = sourceRubric.criteria[sourceIndex];
      if (!sourceItem) {
        notify(`Vòng nguồn không có tiêu chí #${sourceIndex + 1}.`, "warning");
        return;
      }
      const [inherited] = rubricToForm([
        {
          code: sourceItem.code,
          name: sourceItem.name,
          weight: Number(sourceItem.weight),
          minScore: Number(sourceItem.minScore),
          maxScore: Number(sourceItem.maxScore),
          description: sourceItem.description ?? "",
          sortOrder: index + 1,
          levelDescriptors: sourceItem.levelDescriptors
        }
      ]);
      setCriteria((prev) => prev.map((c, i) => (i === index ? inherited : c)));
      notify(
        `Đã kế thừa tiêu chí #${sourceIndex + 1} từ vòng nguồn vào vị trí #${index + 1}.`,
        "success"
      );
    } catch (err) {
      notify(resolveApiError(err, "Kế thừa tiêu chí thất bại."), "danger");
    } finally {
      setInheritBusyIndex(null);
    }
  }

  const sourceCriteria = sourceRubricQuery.data?.criteria ?? [];

  async function handleSave() {
    if (!roundId) return;
    if (locked) {
      notify("Tiêu chí chấm đã khóa vì đã có phiếu chấm được nộp.", "warning");
      return;
    }
    const rubricError = validateRubricCriteria(
      criteria.map((c) => {
        const range = deriveCriteriaScoreRange(c.levelDescriptors);
        return {
          code: c.code,
          name: c.name,
          weight: Number(c.weight),
          minScore: range.minScore,
          maxScore: range.maxScore,
            levelDescriptors: normalizeLevelDescriptors(c.levelDescriptors).map((level) => ({
              label: level.label,
              minScore: Number(level.minScore),
              maxScore: Number(level.maxScore),
              level: level.level
            }))
        };
      })
    );
    if (rubricError) {
      setSaveError(rubricError);
      notify(rubricError, "warning");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await saveRubric(roundId, {
        criteria: criteria.map((c, i) => {
          const range = deriveCriteriaScoreRange(c.levelDescriptors);
          return {
            ...c,
            weight: Number(c.weight),
            minScore: range.minScore,
            maxScore: range.maxScore,
            levelDescriptors: normalizeLevelDescriptors(c.levelDescriptors).map((l) => ({
              ...l,
              minScore: Number(l.minScore),
              maxScore: Number(l.maxScore)
            })),
            sortOrder: i + 1
          };
        }),
        replaceExisting: true
      });
      await invalidateAfterRubricMutation(queryClient, roundId);
      notify("Đã lưu tiêu chí chấm.", "success");
    } catch (err) {
      let msg = resolveApiError(err, "Không lưu được tiêu chí chấm.");
      applyApiFormErrors(err, (errors) => {
        const first = Object.values(errors)[0];
        if (first) msg = first;
      });
      setSaveError(msg);
      notify(msg, "danger");
    } finally {
      setSaving(false);
    }
  }

  if (eventLoading || setupLoading) return <ModuleSkeleton rows={4} />;

  if (!setupContext.hasBoards) {
    return (
      <div className="space-y-lg">
        {!embedded ? (
          <PageHeader
            eyebrow="Chấm điểm"
            title="Tiêu chí chấm"
            description="Cấu hình rubric sau khi đã tạo bảng thi và gán đội."
            actions={<OrganizerContextBar />}
          />
        ) : null}
        <EmptyState
          icon="grid_view"
          title="Chưa có bảng thi"
          description="Tạo vòng, bảng và gán đội trước khi thiết lập tiêu chí chấm."
          action={
            <Link to="/organizer/boards" className="font-label-md text-primary hover:underline">
              Đến Bảng thi →
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      {!embedded ? (
        <>
          <PageHeader
            eyebrow="Chấm điểm"
            title="Tiêu chí chấm"
            description="Cấu hình tiêu chí và trọng số % cho từng vòng. Tổng trọng số phải bằng 100."
            actions={
              <Badge tone={locked ? "warning" : weightSum === 100 ? "success" : "danger"}>
                {locked
                  ? weightSum === 100
                    ? "Đã khóa · 100%"
                    : `Đã khóa · tổng ${weightSum}% (server)`
                  : `Tổng trọng số: ${weightSum}%`}
              </Badge>
            }
          />
          {locked && weightSum !== 100 ? (
            <p className="rounded-lg border border-warning/40 bg-warning-container/25 px-md py-sm font-body-sm text-on-surface">
              Rubric đã khóa trên server — tổng trọng số hiện tại là {weightSum}%. Liên hệ quản trị nếu cần chỉnh
              (có phiếu chấm đã nộp).
            </p>
          ) : null}
          <WorkflowSteps
            title="Quy trình thiết lập"
            description="Cùng thứ tự với sidebar — trạng thái tính từ dữ liệu thật."
            steps={setupSteps}
          />
          <WorkflowSteps
            title="Quy trình chấm & kết quả"
            description="Tiêu chí chấm nằm trong Bài nộp & repo — bước đầu trước chấm điểm và xếp hạng."
            steps={buildRankingWorkflowSteps("rubric")}
          />
        </>
      ) : null}

      <section className="flex flex-wrap items-end gap-md rounded-xl border border-outline-variant bg-surface-container p-md">
        {!embedded ? <OrganizerContextBar /> : null}
        <label className="flex flex-col gap-1 font-label-sm text-on-surface-variant">
          Vòng thi (đích)
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
        {!locked && roundId ? (
          <>
            <label className="flex flex-col gap-1 font-label-sm text-on-surface-variant">
              Mẫu tiêu chí (BE)
              <select
                className="min-w-[14rem] rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
                defaultValue=""
                disabled={templatesQuery.isLoading || templateActionId != null}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  if (!Number.isFinite(id) || id <= 0) return;
                  void (async () => {
                    setTemplateActionId(id);
                    try {
                      const result = await applyCriteriaTemplate(roundId, id, true);
                      setCriteria(
                        rubricToForm(
                          result.criteria.map((c) => ({
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
                      );
                      if (activeRoundId) {
                        await invalidateAfterRubricMutation(queryClient, activeRoundId);
                      }
                      notify("Đã áp dụng mẫu tiêu chí.", "success");
                    } catch (err) {
                      notify(resolveApiError(err, "Áp dụng mẫu thất bại."), "danger");
                    } finally {
                      setTemplateActionId(null);
                      e.target.value = "";
                    }
                  })();
                }}
              >
                <option value="">Chọn mẫu để áp dụng…</option>
                {(templatesQuery.data ?? []).map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.criteriaCount})
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 font-label-sm text-on-surface-variant">
              Kế thừa từ vòng
              <select
                className="min-w-[12rem] rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body-sm"
                value={copySourceRoundId ?? ""}
                onChange={(e) =>
                  setCopySourceRoundId(e.target.value ? Number(e.target.value) : null)
                }
                disabled={templateActionId != null}
              >
                <option value="">Chọn vòng nguồn…</option>
                {rounds
                  .filter((round) => round.id !== roundId)
                  .map((round) => (
                    <option key={round.id} value={round.id}>
                      {round.name}
                    </option>
                  ))}
              </select>
            </label>
          </>
        ) : null}
      </section>

      {loadError ? (
        <RetryPanel
          message={loadError}
          onRetry={() => {
            void refetchRounds();
            void refetchRubric();
          }}
        />
      ) : saveError ? (
        <div className="rounded-xl border border-error/40 bg-error-container/40 p-md">
          <p className="font-body-sm text-on-surface-variant">{saveError}</p>
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
                  {!locked ? (
                    <div className="flex flex-wrap items-center gap-sm">
                      {copySourceRoundId && sourceCriteria.length > 0 ? (
                        <label className="flex items-center gap-1 font-label-sm text-on-surface-variant">
                          Từ tiêu chí
                          <select
                            className="rounded-lg border border-outline-variant bg-surface px-2 py-1 font-body-sm"
                            value={inheritSourceByIndex[index] ?? index}
                            disabled={inheritBusyIndex === index}
                            onChange={(e) =>
                              setInheritSourceByIndex((prev) => ({
                                ...prev,
                                [index]: Number(e.target.value)
                              }))
                            }
                          >
                            {sourceCriteria.map((sourceItem, sourceIndex) => (
                              <option key={`${sourceItem.code}-${sourceIndex}`} value={sourceIndex}>
                                #{sourceIndex + 1} — {sourceItem.name || sourceItem.code}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : null}
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={!copySourceRoundId || inheritBusyIndex === index}
                        loading={inheritBusyIndex === index}
                        onClick={() => void inheritCriterionAt(index)}
                      >
                        Kế thừa
                      </Button>
                      {criteria.length > 1 ? (
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
                  ) : null}
                </div>

                <div className="grid gap-md md:grid-cols-2 lg:grid-cols-4">
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

                <div className="mt-md">
                  <p className="mb-sm font-label-sm text-on-surface">
                    Mức chấm điểm
                    <span className="ml-2 font-body-sm text-on-surface-variant">
                      (phạm vi nhập điểm: {item.minScore}–{item.maxScore})
                    </span>
                  </p>
                  <div className="overflow-x-auto rounded-lg border border-outline-variant/60">
                    <table className="min-w-full text-left">
                      <thead className="bg-surface-container-high">
                        <tr className="font-label-sm text-on-surface-variant">
                          <th className="px-sm py-2">Mức</th>
                          <th className="px-sm py-2">Điểm min</th>
                          <th className="px-sm py-2">Điểm max</th>
                          <th className="min-w-[16rem] px-sm py-2">Mô tả theo mức</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/40">
                        {item.levelDescriptors.map((level, li) => (
                          <tr key={level.level} className="font-body-sm text-on-surface">
                            <td className="whitespace-nowrap px-sm py-2 font-label-sm">{level.label}</td>
                            <td className="px-sm py-2">
                              <input
                                type="number"
                                step={0.1}
                                disabled={locked}
                                className="w-20 rounded border border-outline-variant bg-surface px-2 py-1 text-center"
                                value={level.minScore}
                                onChange={(e) =>
                                  updateLevel(index, li, { minScore: Number(e.target.value) })
                                }
                              />
                            </td>
                            <td className="px-sm py-2">
                              <input
                                type="number"
                                step={0.1}
                                disabled={locked}
                                className="w-20 rounded border border-outline-variant bg-surface px-2 py-1 text-center"
                                value={level.maxScore}
                                onChange={(e) =>
                                  updateLevel(index, li, { maxScore: Number(e.target.value) })
                                }
                              />
                            </td>
                            <td className="px-sm py-2">
                              <textarea
                                className="min-h-[3rem] w-full rounded border border-outline-variant bg-surface px-2 py-1 font-body-sm"
                                value={level.description}
                                disabled={locked}
                                placeholder={`Mô tả ${level.label}`}
                                onChange={(e) => updateLevel(index, li, { description: e.target.value })}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <div className="flex flex-wrap gap-md">
            {!locked ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setCriteria((prev) => [...prev, createEmptyCriteria(prev.length)])}
                >
                  Thêm tiêu chí
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCriteria(createDefaultHackathonRubric())}
                >
                  Dùng mẫu 5 tiêu chí
                </Button>
              </>
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
