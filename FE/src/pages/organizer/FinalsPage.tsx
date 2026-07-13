import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ConfirmAction } from "../../components/feedback/ConfirmAction";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { OrganizerContextBar } from "../../components/ui/OrganizerContextBar";
import { PageHeader } from "../../components/ui/PageHeader";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useEventRounds } from "../../hooks/useEventRounds";
import { queryKeys } from "../../lib/queryKeys";
import {
  executeAdvancements,
  fetchAdvancements,
  previewAdvancements,
  type AdvancementCandidate
} from "../../services/advancementApi";
import { advancementExecuteSchema } from "../../domain/schemas";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { applyApiFormErrors, resolveApiError } from "../../utils/apiError";
import { formatBoardWithRoundLabel } from "../../utils/boardLabels";

function formatScore(score: number) {
  return Number.isInteger(score) ? String(score) : score.toFixed(2);
}

type FinalsFilterState = {
  fromRoundId: number | "";
  toRoundId: number | "";
  topN: number;
};
const FINALS_FILTER_STORAGE_KEY = "seal.organizerFinals.filters";

function loadFinalsFilters(): FinalsFilterState {
  try {
    const raw = window.localStorage.getItem(FINALS_FILTER_STORAGE_KEY);
    if (!raw) throw new Error("empty");
    const parsed = JSON.parse(raw) as Partial<FinalsFilterState>;
    return {
      fromRoundId: typeof parsed.fromRoundId === "number" ? parsed.fromRoundId : "",
      toRoundId: typeof parsed.toRoundId === "number" ? parsed.toRoundId : "",
      topN: typeof parsed.topN === "number" && parsed.topN > 0 ? parsed.topN : 2
    };
  } catch {
    return { fromRoundId: "", toRoundId: "", topN: 2 };
  }
}

export function FinalsPage({ embedded = false }: { embedded?: boolean } = {}) {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const { eventId, loading: eventLoading } = useActiveEvent({ autoSelectFirst: true });
  const { rounds, loading: roundsLoading } = useEventRounds(eventId);
  const initialFilters = useMemo(() => loadFinalsFilters(), []);
  const [fromRoundId, setFromRoundId] = useState<number | "">(initialFilters.fromRoundId);
  const [toRoundId, setToRoundId] = useState<number | "">(initialFilters.toRoundId);
  const [topN, setTopN] = useState(initialFilters.topN);
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const fromId = fromRoundId === "" ? null : fromRoundId;
  const toId = toRoundId === "" ? null : toRoundId;
  const fromRoundName = useMemo(
    () => rounds.find((round) => round.id === fromId)?.name ?? null,
    [rounds, fromId]
  );

  useEffect(() => {
    window.localStorage.setItem(
      FINALS_FILTER_STORAGE_KEY,
      JSON.stringify({ fromRoundId, toRoundId, topN })
    );
  }, [fromRoundId, toRoundId, topN]);

  useEffect(() => {
    if (roundsLoading || rounds.length === 0) return;
    const validRoundIds = new Set(rounds.map((round) => round.id));
    if (fromRoundId !== "" && !validRoundIds.has(fromRoundId)) {
      setFromRoundId("");
    }
    if (toRoundId !== "" && !validRoundIds.has(toRoundId)) {
      setToRoundId("");
    }
  }, [fromRoundId, rounds, roundsLoading, toRoundId]);

  const previewQuery = useQuery({
    queryKey: [...queryKeys.rankings.all, "advance-preview", eventId, fromId, toId, topN],
    queryFn: () => previewAdvancements(eventId!, { fromRoundId: fromId!, toRoundId: toId!, topNPerBoard: topN }),
    enabled: eventId != null && fromId != null && toId != null
  });

  const advancementsQuery = useQuery({
    queryKey: [...queryKeys.rankings.all, "advancements", eventId, toId],
    queryFn: () => fetchAdvancements(eventId!, toId!),
    enabled: eventId != null && toId != null
  });
  const eligibleTeams: AdvancementCandidate[] = useMemo(() => {
    if (!previewQuery.data) return [];
    return previewQuery.data.eligibleTeams?.length
      ? previewQuery.data.eligibleTeams
      : previewQuery.data.candidates;
  }, [previewQuery.data]);

  const suggestedTeamIds = useMemo(
    () => new Set(previewQuery.data?.candidates.map((c) => c.teamId) ?? []),
    [previewQuery.data?.candidates]
  );

  useEffect(() => {
    if (!previewQuery.data) return;
    setSelectedTeamIds(new Set(previewQuery.data.candidates.map((c) => c.teamId)));
  }, [previewQuery.data, fromId, toId, topN]);

  function toggleTeam(teamId: number, checked: boolean) {
    setSelectedTeamIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(teamId);
      else next.delete(teamId);
      return next;
    });
  }

  function applySuggestedSelection() {
    if (!previewQuery.data) return;
    setSelectedTeamIds(new Set(previewQuery.data.candidates.map((c) => c.teamId)));
  }

  function clearSelection() {
    setSelectedTeamIds(new Set());
  }

  async function handleExecute() {
    if (!eventId || fromId == null || toId == null) return;
    const parsed = advancementExecuteSchema.safeParse({
      fromRoundId: fromId,
      toRoundId: toId,
      topNPerBoard: topN,
      teamIds: Array.from(selectedTeamIds)
    });
    if (!parsed.success) {
      setFieldErrors({});
      notify(parsed.error.issues[0]?.message ?? "Dữ liệu chuyển vòng không hợp lệ.", "warning");
      return;
    }
    setFieldErrors({});
    setBusy(true);
    const useTopN = parsed.data.teamIds.length === 0;
    try {
      const result = await executeAdvancements(eventId, {
        fromRoundId: parsed.data.fromRoundId,
        toRoundId: parsed.data.toRoundId,
        topNPerBoard: parsed.data.topNPerBoard,
        teamIds: useTopN ? undefined : parsed.data.teamIds
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.rankings.all });
      notify(`Đã chuyển ${result.teamsAdvanced} đội, gán ${result.slotsAssigned} slot.`, "success");
    } catch (err) {
      applyApiFormErrors(err, setFieldErrors);
      notify(resolveApiError(err, "Chuyển đội thất bại."), "danger");
    } finally {
      setBusy(false);
    }
  }

  const selectedCount = selectedTeamIds.size;
  const executeModeLabel =
    selectedCount > 0 ? `${selectedCount} đội đã chọn` : `top ${topN} / bảng`;

  return (
    <div className="space-y-lg">
      {!embedded ? (
        <PageHeader
          eyebrow="Chuyển vòng"
          title="Chuyển đội sang vòng tiếp theo"
          description="Xem BXH vòng nguồn, chọn đội chuyển sang vòng đích. Top N / bảng tự chọn trước — BTC có thể bổ sung hoặc bỏ tick."
          actions={<OrganizerContextBar />}
        />
      ) : null}
      {eventLoading || roundsLoading ? (
        <ModuleSkeleton rows={4} />
      ) : !eventId || rounds.length < 2 ? (
        <EmptyState icon="emoji_events" title="Cần ít nhất 2 vòng" description="Tạo vòng nguồn và vòng đích trước." />
      ) : (
        <>
          <div className="grid gap-md md:grid-cols-3">
            <label className="space-y-xs font-body-sm">
              Vòng nguồn
              <select
                className="w-full rounded-lg border border-outline-variant p-sm"
                value={fromRoundId}
                onChange={(e) => setFromRoundId(Number(e.target.value))}
              >
                <option value="">Chọn vòng</option>
                {rounds.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-xs font-body-sm">
              Vòng đích
              <select
                className="w-full rounded-lg border border-outline-variant p-sm"
                value={toRoundId}
                onChange={(e) => setToRoundId(Number(e.target.value))}
              >
                <option value="">Chọn vòng</option>
                {rounds.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-xs font-body-sm">
              Top N mỗi bảng
              <input
                type="number"
                min={1}
                className="w-full rounded-lg border border-outline-variant p-sm"
                value={topN}
                onChange={(e) => setTopN(Math.max(1, Number(e.target.value)))}
              />
            </label>
          </div>

          {fromId == null || toId == null ? (
            <EmptyState
              icon="swap_horiz"
              title="Chọn vòng nguồn và vòng đích"
              description="Sau khi chọn, hệ thống hiển thị BXH đã công bố để BTC tick đội chuyển vòng."
            />
          ) : previewQuery.isLoading ? (
            <ModuleSkeleton rows={5} />
          ) : previewQuery.isError ? (
            <EmptyState
              icon="error"
              title="Không tải được BXH"
              description={resolveApiError(previewQuery.error, "Kiểm tra xếp hạng đã công bố chưa.")}
            />
          ) : eligibleTeams.length === 0 ? (
            <EmptyState
              icon="leaderboard"
              title="Chưa có BXH công bố"
              description="Tính xếp hạng và công bố kết quả ở vòng nguồn trước khi chuyển đội."
            />
          ) : (
            <section className="rounded-xl border border-outline-variant p-lg space-y-md">
              <div className="flex flex-wrap items-center justify-between gap-md">
                <div>
                  <h2 className="font-headline-sm">Bảng xếp hạng vòng nguồn</h2>
                  <p className="font-body-sm text-on-surface-variant mt-xs">
                    {eligibleTeams.length} đội · đã chọn {selectedCount}
                    {suggestedTeamIds.size > 0 ? ` · gợi ý top ${topN}/bảng: ${suggestedTeamIds.size}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-sm">
                  <Button variant="secondary" size="sm" onClick={applySuggestedSelection}>
                    Chọn top {topN} mỗi bảng
                  </Button>
                  <Button variant="secondary" size="sm" onClick={clearSelection}>
                    Bỏ chọn tất cả
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-outline-variant">
                <table className="min-w-full text-left table-fixed">
                  <colgroup>
                    <col className="w-12" />
                    <col className="w-16" />
                    <col />
                    <col className="w-28" />
                    <col className="w-24" />
                  </colgroup>
                  <thead className="table-header-bg">
                    <tr className="font-label-sm text-on-surface-variant">
                      <th className="px-md py-sm text-center">Chọn</th>
                      <th className="px-md py-sm">Hạng</th>
                      <th className="px-md py-sm">Đội</th>
                      <th className="px-md py-sm">Vòng · Bảng</th>
                      <th className="px-md py-sm text-right">Điểm TB</th>
                    </tr>
                  </thead>
                  <tbody className="table-divider font-body-sm">
                    {eligibleTeams.map((team) => {
                      const checked = selectedTeamIds.has(team.teamId);
                      const suggested = suggestedTeamIds.has(team.teamId);
                      const selectable = !team.teamStatus || team.teamStatus === "CONFIRMED";
                      return (
                        <tr
                          key={`${team.teamId}-${team.fromBoardId}`}
                          className={checked ? "bg-primary-container/20" : undefined}
                        >
                          <td className="px-md py-sm text-center">
                            <input
                              type="checkbox"
                              className="size-4 rounded border-outline-variant"
                              checked={checked}
                              disabled={!selectable}
                              title={
                                selectable
                                  ? undefined
                                  : "Chỉ đội đã xác nhận mới được chuyển vòng."
                              }
                              onChange={(e) => toggleTeam(team.teamId, e.target.checked)}
                              aria-label={`Chọn ${team.teamName}`}
                            />
                          </td>
                          <td className="px-md py-sm tabular-nums">{team.rank}</td>
                          <td className="px-md py-sm">
                            <span className="font-medium">{team.teamName}</span>
                            {team.teamStatus && team.teamStatus !== "CONFIRMED" ? (
                              <Badge tone={getStatusTone(team.teamStatus)} className="ml-sm align-middle">
                                {getStatusLabel(team.teamStatus)}
                              </Badge>
                            ) : null}
                            {suggested ? (
                              <Badge tone="active" className="ml-sm align-middle">
                                Top {topN}
                              </Badge>
                            ) : null}
                          </td>
                          <td className="px-md py-sm">
                            {formatBoardWithRoundLabel(team.fromBoardName, fromRoundName)}
                          </td>
                          <td className="px-md py-sm text-right tabular-nums">
                            {formatScore(team.averageScore)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {fieldErrors.toRoundId ? (
                <p className="font-body-sm text-error">{fieldErrors.toRoundId}</p>
              ) : null}
              <ConfirmAction
                title="Xác nhận chuyển đội"
                message={
                  selectedCount > 0
                    ? `Chuyển ${selectedCount} đội đã chọn sang vòng đích và gán vào slot trống.`
                    : `Không chọn đội cụ thể — hệ thống lấy top ${topN} đội / bảng từ BXH đã công bố.`
                }
                confirmLabel="Chuyển đội"
                onConfirm={handleExecute}
              >
                <Button disabled={busy}>Thực hiện chuyển đội ({executeModeLabel})</Button>
              </ConfirmAction>
            </section>
          )}

          {advancementsQuery.data && advancementsQuery.data.length > 0 ? (
            <section className="rounded-xl border border-outline-variant p-lg">
              <h2 className="font-headline-sm mb-md">Đã chuyển ({advancementsQuery.data.length})</h2>
              <ul className="space-y-xs font-body-sm">
                {advancementsQuery.data.map((a) => (
                  <li key={a.id}>
                    {a.teamName} — hạng nguồn {a.basisRank} ({formatScore(a.basisScore)})
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
