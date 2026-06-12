import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ConfirmAction } from "../../components/feedback/ConfirmAction";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { Modal } from "../../components/ui/Modal";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { OrganizerContextBar } from "../../components/ui/OrganizerContextBar";
import { PageHeader } from "../../components/ui/PageHeader";
import { useActiveEvent } from "../../hooks/useActiveEvent";
import { useEventTeams } from "../../hooks/useEventTeams";
import { queryKeys } from "../../lib/queryKeys";
import {
  assignTeamAward,
  createAwardCategory,
  DEFAULT_AWARD_CATEGORIES,
  deleteAwardCategory,
  fetchEventAwards,
  publishEventAwards,
  removeTeamAward,
  suggestAwardsFromRanking,
  unpublishEventAwards,
  updateAwardCategory,
  type AwardCategory,
  type AwardType,
  type CreateAwardCategoryPayload
} from "../../services/awardApi";
import { fetchEventRankings } from "../../services/rankingApi";
import { resolveApiError } from "../../utils/apiError";
import { sortByName } from "../../utils/sortContestData";

function formatScore(score: number) {
  return Number.isInteger(score) ? String(score) : score.toFixed(2);
}

const EMPTY_CATEGORY_FORM: CreateAwardCategoryPayload = {
  name: "",
  code: "",
  description: "",
  awardType: "CUSTOM",
  maxWinners: 1
};

export function AwardManagementPage({ embedded = false }: { embedded?: boolean } = {}) {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const { eventId, loading: eventLoading } = useActiveEvent({ autoSelectFirst: true });
  const { teams, loading: teamsLoading } = useEventTeams(eventId, { size: 200 });
  const [busy, setBusy] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [categoryForm, setCategoryForm] = useState<CreateAwardCategoryPayload>(EMPTY_CATEGORY_FORM);
  const [assignCategoryId, setAssignCategoryId] = useState<number | "">("");
  const [assignTeamId, setAssignTeamId] = useState<number | "">("");

  const awardsQuery = useQuery({
    queryKey: queryKeys.awards.event(eventId),
    queryFn: () => fetchEventAwards(eventId!),
    enabled: Boolean(eventId)
  });

  const rankingsQuery = useQuery({
    queryKey: queryKeys.rankings.event(eventId),
    queryFn: () => fetchEventRankings(eventId!),
    enabled: Boolean(eventId)
  });

  const rankedTeams = useMemo(() => {
    const boards = rankingsQuery.data?.boards ?? [];
    const map = new Map<number, { teamId: number; teamName: string; rank: number; score: number; boardName: string }>();
    for (const board of boards) {
      for (const entry of board.entries) {
        const existing = map.get(entry.teamId);
        if (!existing || entry.rank < existing.rank || (entry.rank === existing.rank && entry.averageScore > existing.score)) {
          map.set(entry.teamId, {
            teamId: entry.teamId,
            teamName: entry.teamName,
            rank: entry.rank,
            score: entry.averageScore,
            boardName: board.boardName
          });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => a.rank - b.rank || b.score - a.score);
  }, [rankingsQuery.data]);

  const categories = useMemo(
    () =>
      [...(awardsQuery.data?.categories ?? [])].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.id - b.id
      ),
    [awardsQuery.data?.categories]
  );
  const sortedTeams = useMemo(() => sortByName(teams), [teams]);
  const anyPublished = awardsQuery.data?.published ?? false;
  const hasRankCategories = categories.some((c) => c.awardType === "RANK");

  function openCreateCategoryModal() {
    setEditingCategoryId(null);
    setCategoryForm(EMPTY_CATEGORY_FORM);
    setCategoryModalOpen(true);
  }

  function openEditCategoryModal(category: AwardCategory) {
    setEditingCategoryId(category.id);
    setCategoryForm({
      name: category.name,
      code: category.code,
      description: category.description ?? "",
      awardType: category.awardType,
      rankOrder: category.rankOrder ?? undefined,
      maxWinners: category.maxWinners,
      prizeValue: category.prizeValue ?? "",
      sortOrder: category.sortOrder,
      isActive: category.isActive
    });
    setCategoryModalOpen(true);
  }

  async function invalidateAwards() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.awards.all });
  }

  async function handleSeedDefaults() {
    if (!eventId) return;
    setBusy(true);
    try {
      const existingCodes = new Set(categories.map((c) => c.code));
      let created = 0;
      for (const preset of DEFAULT_AWARD_CATEGORIES) {
        if (existingCodes.has(preset.code)) continue;
        await createAwardCategory(eventId, preset);
        created++;
      }
      await invalidateAwards();
      notify(created > 0 ? `Đã tạo ${created} loại giải mặc định.` : "Các loại giải mặc định đã có sẵn.", "success");
    } catch (err) {
      notify(resolveApiError(err, "Khởi tạo giải mặc định thất bại."), "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveCategory() {
    if (!eventId) return;
    if (!categoryForm.name.trim() || !categoryForm.code.trim()) {
      notify("Nhập tên và mã loại giải.", "warning");
      return;
    }
    setBusy(true);
    try {
      if (editingCategoryId != null) {
        await updateAwardCategory(editingCategoryId, categoryForm);
        notify("Đã cập nhật loại giải.", "success");
      } else {
        await createAwardCategory(eventId, categoryForm);
        notify("Đã tạo loại giải.", "success");
      }
      await invalidateAwards();
      setCategoryModalOpen(false);
      setEditingCategoryId(null);
      setCategoryForm(EMPTY_CATEGORY_FORM);
    } catch (err) {
      notify(
        resolveApiError(err, editingCategoryId != null ? "Cập nhật loại giải thất bại." : "Tạo loại giải thất bại."),
        "danger"
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteCategory(category: AwardCategory) {
    setBusy(true);
    try {
      await deleteAwardCategory(category.id);
      await invalidateAwards();
      notify(`Đã xóa "${category.name}".`, "success");
    } catch (err) {
      notify(resolveApiError(err, "Xóa loại giải thất bại."), "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleAssign() {
    if (!eventId || assignCategoryId === "" || assignTeamId === "") {
      notify("Chọn loại giải và đội.", "warning");
      return;
    }
    setBusy(true);
    try {
      await assignTeamAward(eventId, {
        awardCategoryId: assignCategoryId,
        teamId: assignTeamId
      });
      await invalidateAwards();
      setAssignTeamId("");
      notify("Đã gán giải cho đội.", "success");
    } catch (err) {
      notify(resolveApiError(err, "Gán giải thất bại."), "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveAward(awardId: number) {
    setBusy(true);
    try {
      await removeTeamAward(awardId);
      await invalidateAwards();
      notify("Đã gỡ giải.", "success");
    } catch (err) {
      notify(resolveApiError(err, "Gỡ giải thất bại."), "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleSuggestFromRanking() {
    if (!eventId) return;
    setBusy(true);
    try {
      const result = await suggestAwardsFromRanking(eventId);
      await invalidateAwards();
      notify(result.message, result.created > 0 ? "success" : "neutral");
    } catch (err) {
      notify(resolveApiError(err, "Gợi ý giải từ BXH thất bại."), "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handlePublish() {
    if (!eventId) return;
    setBusy(true);
    try {
      const result = await publishEventAwards(eventId);
      await invalidateAwards();
      notify(`Đã công bố ${result.awardsPublished} giải.`, "success");
    } catch (err) {
      notify(resolveApiError(err, "Công bố giải thất bại."), "danger");
    } finally {
      setBusy(false);
    }
  }

  async function handleUnpublish() {
    if (!eventId) return;
    setBusy(true);
    try {
      await unpublishEventAwards(eventId);
      await invalidateAwards();
      notify("Đã thu hồi công bố giải.", "success");
    } catch (err) {
      notify(resolveApiError(err, "Thu hồi công bố thất bại."), "danger");
    } finally {
      setBusy(false);
    }
  }

  const loading = eventLoading || awardsQuery.isLoading || teamsLoading;

  return (
    <div className="space-y-lg">
      {!embedded ? (
        <PageHeader
          eyebrow="Trao giải"
          title="Quản lý giải thưởng"
          description="Tham khảo BXH, tạo hạng mục giải, gán đội và công bố kết quả."
          actions={<OrganizerContextBar />}
        />
      ) : null}

      {loading ? (
        <ModuleSkeleton rows={6} />
      ) : !eventId ? (
        <EmptyState icon="event" title="Chọn cuộc thi" description="Chọn cuộc thi để quản lý giải thưởng." />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-sm">
            <Badge tone={anyPublished ? "active" : "neutral"}>
              {anyPublished ? "ĐÃ CÔNG BỐ" : "NHÁP"}
            </Badge>
            <Button variant="secondary" size="sm" disabled={busy} onClick={() => void handleSeedDefaults()}>
              Khởi tạo giải mặc định
            </Button>
            <Button variant="secondary" size="sm" disabled={busy || !hasRankCategories} onClick={() => void handleSuggestFromRanking()}>
              Gợi ý Nhất/Nhì/Ba từ BXH
            </Button>
            <Button size="sm" disabled={busy} onClick={openCreateCategoryModal}>
              Thêm loại giải
            </Button>
            {anyPublished ? (
              <ConfirmAction
                title="Thu hồi công bố"
                message="Kết quả trao giải sẽ ẩn khỏi trang công khai."
                confirmLabel="Thu hồi"
                onConfirm={handleUnpublish}
              >
                <Button variant="secondary" size="sm" disabled={busy}>
                  Thu hồi công bố
                </Button>
              </ConfirmAction>
            ) : (
              <ConfirmAction
                title="Công bố giải thưởng"
                message="Mọi người sẽ thấy danh sách giải trên trang kết quả công khai."
                confirmLabel="Công bố"
                onConfirm={handlePublish}
              >
                <Button size="sm" disabled={busy || categories.every((c) => c.winnerCount === 0)}>
                  Công bố giải
                </Button>
              </ConfirmAction>
            )}
          </div>

          <div className="grid gap-lg lg:grid-cols-2">
            <section className="rounded-xl border border-outline-variant p-lg space-y-md">
              <h2 className="font-headline-sm">BXH / danh sách đội</h2>
              {rankingsQuery.isLoading ? (
                <ModuleSkeleton rows={4} />
              ) : rankedTeams.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-outline-variant">
                  <table className="min-w-full text-left font-body-sm">
                    <thead className="table-header-bg font-label-sm text-on-surface-variant">
                      <tr>
                        <th className="px-md py-sm">Hạng</th>
                        <th className="px-md py-sm">Đội</th>
                        <th className="px-md py-sm">Bảng</th>
                        <th className="px-md py-sm text-right">Điểm</th>
                      </tr>
                    </thead>
                    <tbody className="table-divider">
                      {rankedTeams.map((team) => (
                        <tr key={team.teamId}>
                          <td className="px-md py-sm tabular-nums">{team.rank}</td>
                          <td className="px-md py-sm">{team.teamName}</td>
                          <td className="px-md py-sm">{team.boardName}</td>
                          <td className="px-md py-sm text-right tabular-nums">{formatScore(team.score)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : teams.length > 0 ? (
                <ul className="space-y-xs font-body-sm max-h-80 overflow-y-auto">
                  {sortedTeams.map((team) => (
                    <li key={team.id} className="rounded-lg border border-outline-variant px-md py-sm">
                      {team.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon="groups"
                  title="Chưa có đội"
                  description="Đội đăng ký hoặc BXH sẽ hiện ở đây để tham khảo khi trao giải."
                />
              )}

              <div className="rounded-lg border border-dashed border-outline-variant p-md space-y-sm">
                <p className="font-label-sm">Gán nhanh</p>
                <div className="grid gap-sm sm:grid-cols-2">
                  <select
                    className="rounded-lg border border-outline-variant p-sm font-body-sm"
                    value={assignCategoryId}
                    onChange={(e) => setAssignCategoryId(e.target.value ? Number(e.target.value) : "")}
                  >
                    <option value="">Chọn giải</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.winnerCount}/{c.maxWinners})
                      </option>
                    ))}
                  </select>
                  <select
                    className="rounded-lg border border-outline-variant p-sm font-body-sm"
                    value={assignTeamId}
                    onChange={(e) => setAssignTeamId(e.target.value ? Number(e.target.value) : "")}
                  >
                    <option value="">Chọn đội</option>
                    {sortedTeams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button size="sm" disabled={busy} onClick={() => void handleAssign()}>
                  Gán đội nhận giải
                </Button>
              </div>
            </section>

            <section className="rounded-xl border border-outline-variant p-lg space-y-md">
              <h2 className="font-headline-sm">Hạng mục giải thưởng</h2>
              {categories.length === 0 ? (
                <EmptyState
                  icon="emoji_events"
                  title="Chưa có loại giải"
                  description='Nhấn "Khởi tạo giải mặc định" hoặc "Thêm loại giải".'
                />
              ) : (
                <ul className="space-y-md">
                  {categories.map((category) => (
                    <li key={category.id} className="rounded-lg border border-outline-variant p-md space-y-sm">
                      <div className="flex flex-wrap items-start justify-between gap-sm">
                        <div>
                          <div className="flex flex-wrap items-center gap-sm">
                            <h3 className="font-label-lg">{category.name}</h3>
                            <Badge tone={category.awardType === "RANK" ? "active" : "neutral"}>
                              {category.awardType === "RANK" ? "Hạng" : "Tùy chọn"}
                            </Badge>
                          </div>
                          {category.description ? (
                            <p className="font-body-sm text-on-surface-variant mt-xs">{category.description}</p>
                          ) : null}
                          <p className="font-body-sm text-on-surface-variant mt-xs">
                            Tối đa {category.maxWinners} đội · đã gán {category.winnerCount}
                            {category.rankOrder ? ` · hạng BXH ${category.rankOrder}` : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-sm">
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={busy}
                            onClick={() => openEditCategoryModal(category)}
                          >
                            Sửa
                          </Button>
                          <ConfirmAction
                            title="Xóa loại giải"
                            message={`Xóa "${category.name}" và mọi đội đã gán?`}
                            confirmLabel="Xóa"
                            onConfirm={() => void handleDeleteCategory(category)}
                          >
                            <Button variant="secondary" size="sm" disabled={busy}>
                              Xóa
                            </Button>
                          </ConfirmAction>
                        </div>
                      </div>
                      {category.winners.length > 0 ? (
                        <ul className="space-y-xs font-body-sm">
                          {category.winners.map((winner) => (
                            <li
                              key={winner.id}
                              className="flex flex-wrap items-center justify-between gap-sm rounded-md bg-surface-container-low px-sm py-xs"
                            >
                              <span>
                                {winner.teamName}
                                {winner.note ? (
                                  <span className="text-on-surface-variant"> — {winner.note}</span>
                                ) : null}
                              </span>
                              <Button
                                variant="secondary"
                                size="sm"
                                disabled={busy}
                                onClick={() => void handleRemoveAward(winner.id)}
                              >
                                Gỡ
                              </Button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="font-body-sm text-on-surface-variant">Chưa gán đội.</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}

      <Modal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title={editingCategoryId != null ? "Sửa loại giải" : "Thêm loại giải"}
      >
        <div className="space-y-md font-body-sm">
          <label className="block space-y-xs">
            Tên giải
            <input
              className="w-full rounded-lg border border-outline-variant p-sm"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm((f) => ({ ...f, name: e.target.value }))}
            />
          </label>
          <label className="block space-y-xs">
            Mã (code)
            <input
              className="w-full rounded-lg border border-outline-variant p-sm"
              value={categoryForm.code}
              onChange={(e) => setCategoryForm((f) => ({ ...f, code: e.target.value }))}
            />
          </label>
          <label className="block space-y-xs">
            Mô tả
            <textarea
              className="w-full rounded-lg border border-outline-variant p-sm"
              rows={2}
              value={categoryForm.description ?? ""}
              onChange={(e) => setCategoryForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>
          <label className="block space-y-xs">
            Loại
            <select
              className="w-full rounded-lg border border-outline-variant p-sm"
              value={categoryForm.awardType}
              onChange={(e) =>
                setCategoryForm((f) => ({ ...f, awardType: e.target.value as AwardType }))
              }
            >
              <option value="RANK">Theo hạng BXH</option>
              <option value="CUSTOM">Tùy chọn (BTC chọn)</option>
            </select>
          </label>
          {categoryForm.awardType === "RANK" ? (
            <label className="block space-y-xs">
              Hạng BXH (1 = nhất, 2 = nhì, …)
              <input
                type="number"
                min={1}
                className="w-full rounded-lg border border-outline-variant p-sm"
                value={categoryForm.rankOrder ?? ""}
                onChange={(e) =>
                  setCategoryForm((f) => ({
                    ...f,
                    rankOrder: e.target.value ? Number(e.target.value) : undefined
                  }))
                }
              />
            </label>
          ) : null}
          <label className="block space-y-xs">
            Số đội tối đa
            <input
              type="number"
              min={1}
              className="w-full rounded-lg border border-outline-variant p-sm"
              value={categoryForm.maxWinners ?? 1}
              onChange={(e) =>
                setCategoryForm((f) => ({ ...f, maxWinners: Math.max(1, Number(e.target.value)) }))
              }
            />
          </label>
          <label className="block space-y-xs">
            Giá trị giải (tuỳ chọn)
            <input
              className="w-full rounded-lg border border-outline-variant p-sm"
              value={categoryForm.prizeValue ?? ""}
              onChange={(e) => setCategoryForm((f) => ({ ...f, prizeValue: e.target.value }))}
            />
          </label>
          <div className="flex justify-end gap-sm">
            <Button variant="secondary" onClick={() => setCategoryModalOpen(false)}>
              Huỷ
            </Button>
            <Button disabled={busy} onClick={() => void handleSaveCategory()}>
              {editingCategoryId != null ? "Lưu" : "Tạo"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
