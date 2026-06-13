import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
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
import { useEventBoards } from "../../hooks/useEventBoards";
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
import {
  groupAwardCategoriesByRound,
  resolveRoundDisplayName,
  type AwardRankingRow
} from "../../utils/awardLabels";
import { buildRoundNameById, formatBoardRankingLabel, groupBoardRankingsByRound } from "../../utils/boardLabels";
import { resolveApiError } from "../../utils/apiError";
import { resolveDefaultRoundId } from "../../utils/pickActiveRound";
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
  const { rounds, boards, loading: boardsLoading } = useEventBoards(eventId);
  const { teams, loading: teamsLoading } = useEventTeams(eventId, { size: 200 });
  const [busy, setBusy] = useState(false);
  const [roundId, setRoundId] = useState<number | null>(null);
  const [boardId, setBoardId] = useState<number | null>(null);
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

  const activeRoundId = resolveDefaultRoundId(rounds, roundId);
  const roundNameById = useMemo(() => buildRoundNameById(rounds), [rounds]);
  const boardsInRound = useMemo(
    () => (activeRoundId != null ? boards.filter((b) => b.roundId === activeRoundId) : []),
    [boards, activeRoundId]
  );

  useEffect(() => {
    setRoundId((prev) => resolveDefaultRoundId(rounds, prev));
  }, [rounds]);

  useEffect(() => {
    setBoardId((prev) => (prev && boardsInRound.some((b) => b.id === prev) ? prev : null));
  }, [boardsInRound, activeRoundId]);

  const rankingBoards = useMemo(() => {
    const allBoards = rankingsQuery.data?.boards ?? [];
    let filtered = activeRoundId != null ? allBoards.filter((b) => b.roundId === activeRoundId) : allBoards;
    if (boardId != null) {
      filtered = filtered.filter((b) => b.boardId === boardId);
    }
    return filtered.filter((b) => b.entries.length > 0);
  }, [rankingsQuery.data, activeRoundId, boardId]);

  const rankingBoardsByRound = useMemo(
    () => groupBoardRankingsByRound(rankingBoards),
    [rankingBoards]
  );

  const rankingRows = useMemo((): AwardRankingRow[] => {
    const rows: AwardRankingRow[] = [];
    for (const board of rankingBoards) {
      const roundName =
        board.roundName ?? (board.roundId != null ? roundNameById[board.roundId] : null) ?? "Vòng";
      for (const entry of board.entries) {
        rows.push({
          teamId: entry.teamId,
          teamName: entry.teamName,
          rank: entry.rank,
          score: entry.averageScore,
          boardId: board.boardId,
          boardName: board.boardName,
          roundId: board.roundId ?? null,
          roundName
        });
      }
    }
    return rows.sort(
      (a, b) =>
        a.boardName.localeCompare(b.boardName, "vi") ||
        a.rank - b.rank ||
        b.score - a.score
    );
  }, [rankingBoards, roundNameById]);

  const categories = useMemo(
    () =>
      [...(awardsQuery.data?.categories ?? [])].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.id - b.id
      ),
    [awardsQuery.data?.categories]
  );
  const categoryGroups = useMemo(
    () => groupAwardCategoriesByRound(categories, roundNameById),
    [categories, roundNameById]
  );
  const sortedTeams = useMemo(() => sortByName(teams), [teams]);
  const anyPublished = awardsQuery.data?.published ?? false;
  const hasRankCategories = categories.some((c) => c.awardType === "RANK");

  function openCreateCategoryModal() {
    setEditingCategoryId(null);
    setCategoryForm({
      ...EMPTY_CATEGORY_FORM,
      roundId: activeRoundId ?? undefined
    });
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
      roundId: category.roundId ?? undefined,
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
        teamId: assignTeamId,
        roundId: activeRoundId ?? undefined
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
      const result = await suggestAwardsFromRanking(eventId, {
        roundId: activeRoundId ?? undefined,
        boardId: boardId ?? undefined
      });
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

  const loading = eventLoading || awardsQuery.isLoading || teamsLoading || boardsLoading;
  const activeRoundName = resolveRoundDisplayName(activeRoundId, roundNameById);
  const scopeHint =
    boardId != null
      ? formatBoardRankingLabel(
          rankingBoards.find((b) => b.boardId === boardId) ?? {
            boardName: boardsInRound.find((b) => b.id === boardId)?.name ?? "Bảng",
            roundName: activeRoundName
          }
        )
      : activeRoundName;

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
            <Button variant="secondary" size="sm" disabled={busy || !hasRankCategories || rankingRows.length === 0} onClick={() => void handleSuggestFromRanking()}>
              Gợi ý Nhất/Nhì/Ba ({scopeHint})
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
              <div className="flex flex-wrap items-end justify-between gap-md">
                <h2 className="font-headline-sm">BXH tham khảo</h2>
                <div className="flex flex-wrap gap-sm">
                  <label className="flex flex-col gap-1 font-label-sm text-on-surface-variant">
                    Vòng
                    <select
                      className="min-w-[10rem] rounded-lg border border-outline-variant p-sm font-body-sm"
                      value={activeRoundId ?? ""}
                      onChange={(e) => setRoundId(e.target.value ? Number(e.target.value) : null)}
                      disabled={!rounds.length}
                    >
                      {rounds.map((round) => (
                        <option key={round.id} value={round.id}>
                          {round.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 font-label-sm text-on-surface-variant">
                    Bảng
                    <select
                      className="min-w-[10rem] rounded-lg border border-outline-variant p-sm font-body-sm"
                      value={boardId ?? ""}
                      onChange={(e) => setBoardId(e.target.value ? Number(e.target.value) : null)}
                      disabled={!boardsInRound.length}
                    >
                      <option value="">Tất cả bảng vòng này</option>
                      {boardsInRound.map((board) => (
                        <option key={board.id} value={board.id}>
                          {board.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
              <p className="font-body-sm text-on-surface-variant">
                Đang xem BXH của <strong className="text-on-surface">{scopeHint}</strong>. Gợi ý giải và tham
                chiếu hạng theo phạm vi vòng/bảng đã chọn — không gộp chéo vòng loại và chung kết.
              </p>
              {rankingsQuery.isLoading ? (
                <ModuleSkeleton rows={4} />
              ) : rankingRows.length > 0 ? (
                boardId != null ? (
                  <div className="overflow-x-auto rounded-lg border border-outline-variant">
                    <table className="min-w-full text-left font-body-sm">
                      <thead className="table-header-bg font-label-sm text-on-surface-variant">
                        <tr>
                          <th className="px-md py-sm">Hạng</th>
                          <th className="px-md py-sm">Đội</th>
                          <th className="px-md py-sm text-right">Điểm</th>
                        </tr>
                      </thead>
                      <tbody className="table-divider">
                        {rankingRows.map((team) => (
                          <tr key={`${team.boardId}-${team.teamId}`}>
                            <td className="px-md py-sm tabular-nums">{team.rank}</td>
                            <td className="px-md py-sm">{team.teamName}</td>
                            <td className="px-md py-sm text-right tabular-nums">{formatScore(team.score)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="space-y-md">
                    {rankingBoardsByRound.map((group) =>
                      group.boards.map((board) => (
                        <div key={board.boardId} className="overflow-x-auto rounded-lg border border-outline-variant">
                          <div className="border-b border-outline-variant bg-surface-container-low px-md py-sm font-label-sm text-on-surface">
                            {formatBoardRankingLabel(board)} · {board.entries.length} đội
                          </div>
                          <table className="min-w-full text-left font-body-sm">
                            <thead className="table-header-bg font-label-sm text-on-surface-variant">
                              <tr>
                                <th className="px-md py-sm">Hạng</th>
                                <th className="px-md py-sm">Đội</th>
                                <th className="px-md py-sm text-right">Điểm</th>
                              </tr>
                            </thead>
                            <tbody className="table-divider">
                              {board.entries.map((entry) => (
                                <tr key={entry.teamId}>
                                  <td className="px-md py-sm tabular-nums">{entry.rank}</td>
                                  <td className="px-md py-sm">{entry.teamName}</td>
                                  <td className="px-md py-sm text-right tabular-nums">
                                    {formatScore(entry.averageScore)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))
                    )}
                  </div>
                )
              ) : (
                <>
                  <EmptyState
                    icon="leaderboard"
                    title="Chưa có BXH trong phạm vi này"
                    description="Tính và công bố xếp hạng cho vòng/bảng đang chọn trước khi gợi ý giải theo hạng."
                  />
                  {teams.length > 0 ? (
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
                      description="Đội đăng ký sẽ hiện ở đây để gán giải thủ công."
                    />
                  )}
                </>
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
                <div className="space-y-lg">
                  {categoryGroups.map((group) => (
                    <div key={group.key} className="space-y-md">
                      <h3 className="font-label-md text-on-surface-variant">{group.roundName}</h3>
                      <ul className="space-y-md">
                        {group.categories.map((category) => (
                          <li key={category.id} className="rounded-lg border border-outline-variant p-md space-y-sm">
                            <div className="flex flex-wrap items-start justify-between gap-sm">
                              <div>
                                <div className="flex flex-wrap items-center gap-sm">
                                  <h4 className="font-label-lg">{category.name}</h4>
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
                                  {category.roundId != null
                                    ? ` · ${resolveRoundDisplayName(category.roundId, roundNameById)}`
                                    : ""}
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
                    </div>
                  ))}
                </div>
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
            Vòng áp dụng
            <select
              className="w-full rounded-lg border border-outline-variant p-sm"
              value={categoryForm.roundId ?? ""}
              onChange={(e) =>
                setCategoryForm((f) => ({
                  ...f,
                  roundId: e.target.value ? Number(e.target.value) : undefined
                }))
              }
            >
              <option value="">Toàn cuộc thi</option>
              {rounds.map((round) => (
                <option key={round.id} value={round.id}>
                  {round.name}
                </option>
              ))}
            </select>
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
