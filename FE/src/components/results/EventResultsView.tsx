import { useEffect, useMemo, useState } from "react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import type { BoardRanking, PublicEventResults, RankingTeamEntry } from "../../services/rankingApi";
import { formatBoardRankingLabel } from "../../utils/boardLabels";
import { sortBoardRankings } from "../../utils/sortContestData";

interface EventResultsViewProps {
  results: PublicEventResults;
  participantView?: boolean;
  /** Highlight đội của thí sinh đang xem */
  highlightTeamId?: number | null;
}

interface RoundGroup {
  key: string;
  roundId: number | null;
  roundName: string;
  boards: BoardRanking[];
}

function roundKey(board: BoardRanking) {
  return board.roundId != null ? `round-${board.roundId}` : `board-round-${board.boardId}`;
}

function groupBoardsByRound(boards: BoardRanking[]): RoundGroup[] {
  const groups: RoundGroup[] = [];
  const indexByKey = new Map<string, number>();
  for (const board of boards) {
    const key = roundKey(board);
    if (!indexByKey.has(key)) {
      indexByKey.set(key, groups.length);
      groups.push({
        key,
        roundId: board.roundId ?? null,
        roundName: board.roundName ?? "Vòng",
        boards: []
      });
    }
    groups[indexByKey.get(key)!].boards.push(board);
  }
  return groups;
}

function findBoardForTeam(boards: BoardRanking[], teamId: number | null | undefined) {
  if (teamId == null) return null;
  return boards.find((board) => board.entries.some((entry) => entry.teamId === teamId)) ?? null;
}

function formatScore(value: number | null | undefined, digits = 2) {
  if (value == null) return "Chưa có";
  return Number(value).toFixed(digits);
}

function formatSubmittedAt(value?: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

function FilterPills<T extends string | number>({
  label,
  options,
  value,
  onChange
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  if (options.length <= 1) return null;
  return (
    <div className="space-y-xs">
      <p className="font-label-sm text-on-surface-variant">{label}</p>
      <div className="flex flex-wrap gap-xs">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => onChange(option.value)}
              className={`rounded-full border px-3 py-1.5 font-label-sm transition ${
                active
                  ? "border-primary bg-primary-container text-on-primary-container"
                  : "border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function EventResultsView({ results, participantView, highlightTeamId }: EventResultsViewProps) {
  const [detailEntry, setDetailEntry] = useState<{
    board: BoardRanking;
    entry: RankingTeamEntry;
  } | null>(null);

  useEffect(() => {
    if (!participantView || !detailEntry || highlightTeamId == null) return;
    if (detailEntry.entry.teamId !== highlightTeamId) {
      setDetailEntry(null);
    }
  }, [detailEntry, highlightTeamId, participantView]);

  const sortedBoards = useMemo(
    () =>
      sortBoardRankings(
        results.boards.filter((board) => board.published && (board.entries?.length ?? 0) > 0)
      ),
    [results.boards]
  );
  const roundGroups = useMemo(() => groupBoardsByRound(sortedBoards), [sortedBoards]);
  const myBoard = useMemo(
    () => findBoardForTeam(sortedBoards, highlightTeamId),
    [sortedBoards, highlightTeamId]
  );

  const defaultRoundGroup = roundGroups[0] ?? null;
  const [roundKeySelected, setRoundKeySelected] = useState(defaultRoundGroup?.key ?? "");
  const [boardIdSelected, setBoardIdSelected] = useState<number | null>(
    defaultRoundGroup?.boards[0]?.boardId ?? null
  );

  useEffect(() => {
    if (roundGroups.length === 0) return;
    const preferredRound = roundGroups[0];
    const boardInRound =
      myBoard && preferredRound.boards.some((board) => board.boardId === myBoard.boardId)
        ? myBoard
        : preferredRound.boards[0];
    setRoundKeySelected(preferredRound.key);
    setBoardIdSelected(boardInRound?.boardId ?? preferredRound.boards[0]?.boardId ?? null);
  }, [results.eventId, roundGroups, myBoard]);

  const activeRound = roundGroups.find((group) => group.key === roundKeySelected) ?? roundGroups[0];
  const boardsInRound = useMemo(() => activeRound?.boards ?? [], [activeRound]);
  const activeBoard =
    boardsInRound.find((board) => board.boardId === boardIdSelected) ?? boardsInRound[0] ?? null;

  useEffect(() => {
    if (!activeRound) return;
    if (!boardsInRound.some((board) => board.boardId === boardIdSelected)) {
      setBoardIdSelected(boardsInRound[0]?.boardId ?? null);
    }
  }, [activeRound, boardsInRound, boardIdSelected]);

  if (!results.published || sortedBoards.length === 0) {
    return (
      <EmptyState
        icon="leaderboard"
        title={participantView ? "Chưa có kết quả" : "Chưa công bố"}
        description={
          participantView
            ? "Ban tổ chức sẽ công bố bảng xếp hạng sau khi hoàn tất chấm điểm."
            : "Cuộc thi này chưa công bố kết quả chính thức, hoặc các bảng đã được thu hồi để tính lại."
        }
      />
    );
  }

  const totalTeams = results.boards.reduce((sum, board) => sum + board.entries.length, 0);
  const hiddenTeams = results.boards.reduce((sum, board) => sum + (board.hiddenTeamCount ?? 0), 0);

  function jumpToMyBoard() {
    if (!myBoard) return;
    const round = roundGroups.find((group) =>
      group.boards.some((board) => board.boardId === myBoard.boardId)
    );
    if (round) setRoundKeySelected(round.key);
    setBoardIdSelected(myBoard.boardId);
  }

  return (
    <div className="space-y-md">
      <div className="flex flex-wrap items-center justify-between gap-md rounded-xl border border-outline-variant bg-surface-container px-md py-sm">
        <div className="flex flex-wrap items-center gap-md">
          <Badge tone="success">Đã công bố</Badge>
          {results.publishedAt ? (
            <span className="font-body-sm text-on-surface-variant">
              {new Date(results.publishedAt).toLocaleString("vi-VN")}
            </span>
          ) : null}
        </div>
        <p className="font-body-sm text-on-surface-variant">
          {roundGroups.length} vòng · {results.boards.length} bảng · {totalTeams} lượt xếp hạng
        </p>
      </div>

      {hiddenTeams > 0 ? (
        <div className="rounded-xl border border-warning/40 bg-warning-container px-md py-sm text-on-warning-container">
          <p className="font-label-md">Đã ẩn {hiddenTeams} đội không còn đủ điều kiện khỏi kết quả công khai.</p>
          <p className="font-body-sm opacity-85">
            Các đội bị từ chối, bị loại hoặc chưa xác nhận sẽ không xuất hiện trong bảng xếp hạng đã công bố.
          </p>
        </div>
      ) : null}

      <section className="space-y-md rounded-xl border border-outline-variant bg-surface-container p-md">
        {roundGroups.length === 1 ? (
          <p className="font-label-sm text-on-surface-variant">
            Vòng: <span className="text-on-surface">{roundGroups[0]!.roundName}</span>
          </p>
        ) : (
          <FilterPills
            label="Vòng"
            value={roundKeySelected}
            onChange={setRoundKeySelected}
            options={roundGroups.map((group) => ({
              value: group.key,
              label: group.roundName
            }))}
          />
        )}

        <FilterPills
          label={`Bảng${activeRound ? ` · ${activeRound.roundName}` : ""}`}
          value={boardIdSelected ?? boardsInRound[0]?.boardId ?? 0}
          onChange={(id) => setBoardIdSelected(id)}
          options={boardsInRound.map((board) => ({
            value: board.boardId,
            label: `${board.boardName} (${board.entries.length})`
          }))}
        />

        {participantView && myBoard && activeBoard?.boardId !== myBoard.boardId ? (
          <Button type="button" variant="secondary" size="sm" onClick={jumpToMyBoard}>
            Xem bảng của tôi ({formatBoardRankingLabel(myBoard)})
          </Button>
        ) : null}
      </section>

      {activeBoard ? (
        <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
          <div className="flex flex-wrap items-center justify-between gap-sm border-b border-outline-variant px-md py-sm">
            <div>
              <h2 className="font-headline-sm text-on-surface">{formatBoardRankingLabel(activeBoard)}</h2>
              <p className="font-body-sm text-on-surface-variant">
                {activeBoard.entries.length} đội
                {(activeBoard.hiddenTeamCount ?? 0) > 0
                  ? ` · đã ẩn ${activeBoard.hiddenTeamCount} đội không hợp lệ`
                  : ""}
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed text-left">
              <colgroup>
                <col className="w-20" />
                <col />
                <col className="w-32" />
                <col className="w-32" />
                {participantView ? <col className="w-32" /> : null}
              </colgroup>
              <thead className="table-header-bg">
                <tr className="font-label-sm text-on-surface-variant">
                  <th className="px-md py-sm">Hạng</th>
                  <th className="px-md py-sm">Đội</th>
                  <th className="px-md py-sm text-right">Điểm TB</th>
                  <th className="px-md py-sm text-right">GK đã nộp</th>
                  {participantView ? <th className="px-md py-sm text-right">Chi tiết</th> : null}
                </tr>
              </thead>
              <tbody className="table-divider">
                {activeBoard.entries.map((row) => {
                  const isOwnTeam = highlightTeamId != null && row.teamId === highlightTeamId;
                  return (
                    <tr
                      key={row.teamId}
                      className={`font-body-sm text-on-surface ${isOwnTeam ? "bg-primary-container/30" : ""}`}
                    >
                      <td className="px-md py-md align-middle font-headline-sm tabular-nums">
                        {row.rank}
                      </td>
                      <td className="px-md py-md align-middle">
                        <div className="flex flex-wrap items-center gap-sm">
                          <span className="font-label-md">{row.teamName}</span>
                          {isOwnTeam ? <Badge tone="active">Đội bạn</Badge> : null}
                        </div>
                      </td>
                      <td className="px-md py-md align-middle text-right tabular-nums">
                        {Number(row.averageScore).toFixed(2)}
                      </td>
                      <td className="px-md py-md align-middle text-right tabular-nums">{row.submittedJudgeCount}</td>
                      {participantView ? (
                        <td className="px-md py-md align-middle text-right">
                          {isOwnTeam ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="primary"
                              onClick={() =>
                                setDetailEntry((current) =>
                                  current?.entry.teamId === row.teamId && current.board.boardId === activeBoard.boardId
                                    ? null
                                    : { board: activeBoard, entry: row }
                                )
                              }
                            >
                              Chi tiết
                            </Button>
                          ) : (
                            <span className="font-body-sm text-on-surface-variant">—</span>
                          )}
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {detailEntry ? (
        <section className="rounded-xl border border-primary/40 bg-primary-container/20 p-md">
          <div className="flex flex-wrap items-start justify-between gap-sm">
            <div>
              <h3 className="font-title-md text-on-surface">Chi tiết kết quả</h3>
              <p className="font-body-sm text-on-surface-variant">
                {detailEntry.entry.teamName} · {formatBoardRankingLabel(detailEntry.board)}
              </p>
            </div>
            <Button type="button" size="sm" variant="ghost" onClick={() => setDetailEntry(null)}>
              Đóng
            </Button>
          </div>
          <dl className="mt-md grid gap-sm sm:grid-cols-3">
            <div className="rounded-lg border border-outline-variant bg-surface px-md py-sm">
              <dt className="font-label-sm text-on-surface-variant">Hạng</dt>
              <dd className="font-headline-sm tabular-nums">{detailEntry.entry.rank}</dd>
            </div>
            <div className="rounded-lg border border-outline-variant bg-surface px-md py-sm">
              <dt className="font-label-sm text-on-surface-variant">Điểm trung bình</dt>
              <dd className="font-headline-sm tabular-nums">
                {Number(detailEntry.entry.averageScore).toFixed(2)}
              </dd>
            </div>
            <div className="rounded-lg border border-outline-variant bg-surface px-md py-sm">
              <dt className="font-label-sm text-on-surface-variant">Giám khảo đã nộp</dt>
              <dd className="font-headline-sm tabular-nums">{detailEntry.entry.submittedJudgeCount}</dd>
            </div>
          </dl>

          {detailEntry.entry.judgeScores?.length ? (
            <div className="mt-md overflow-x-auto rounded-lg border border-outline-variant bg-surface">
              <table className="min-w-full table-fixed text-left">
                <colgroup>
                  <col />
                  <col className="w-28" />
                  <col className="w-36" />
                </colgroup>
                <thead className="table-header-bg">
                  <tr className="font-label-sm text-on-surface-variant">
                    <th className="px-md py-sm">Giám khảo</th>
                    <th className="px-md py-sm text-right">Điểm</th>
                    <th className="px-md py-sm text-right">Thời gian nộp</th>
                  </tr>
                </thead>
                <tbody className="table-divider font-body-sm">
                  {detailEntry.entry.judgeScores.map((judge) => (
                    <tr key={judge.judgeId}>
                      <td className="px-md py-sm">
                        <span className="font-label-md text-on-surface">{judge.judgeName}</span>
                        {judge.feedback ? (
                          <span className="mt-xs block text-on-surface-variant">{judge.feedback}</span>
                        ) : null}
                      </td>
                      <td className="px-md py-sm text-right tabular-nums">{formatScore(judge.totalScore)}</td>
                      <td className="px-md py-sm text-right text-on-surface-variant">
                        {formatSubmittedAt(judge.submittedAt) ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-md rounded-lg border border-outline-variant bg-surface px-md py-sm font-body-sm text-on-surface-variant">
              {detailEntry.entry.submittedJudgeCount > 0
                ? "Backend hiện chưa trả dữ liệu chi tiết phiếu chấm cho kết quả này. Hãy tải lại sau khi backend được cập nhật/restart."
                : "Chưa có bảng điểm giám khảo chi tiết được công bố."}
            </p>
          )}

          {detailEntry.entry.criteriaScores?.length ? (
            <div className="mt-md overflow-x-auto rounded-lg border border-outline-variant bg-surface">
              <table className="min-w-full table-fixed text-left">
                <colgroup>
                  <col />
                  <col className="w-24" />
                  <col className="w-28" />
                  <col className="w-28" />
                </colgroup>
                <thead className="table-header-bg">
                  <tr className="font-label-sm text-on-surface-variant">
                    <th className="px-md py-sm">Tiêu chí</th>
                    <th className="px-md py-sm text-right">Trọng số</th>
                    <th className="px-md py-sm text-right">Điểm TB</th>
                    <th className="px-md py-sm text-right">Điểm quy đổi</th>
                  </tr>
                </thead>
                <tbody className="table-divider font-body-sm">
                  {detailEntry.entry.criteriaScores.map((criterion) => (
                    <tr key={criterion.criteriaId}>
                      <td className="px-md py-sm">
                        <span className="font-label-md text-on-surface">{criterion.criteriaName}</span>
                        {criterion.comments?.length ? (
                          <ul className="mt-xs list-disc space-y-1 pl-md text-on-surface-variant">
                            {criterion.comments.map((comment, index) => (
                              <li key={`${criterion.criteriaId}-${index}`}>{comment}</li>
                            ))}
                          </ul>
                        ) : null}
                      </td>
                      <td className="px-md py-sm text-right tabular-nums">{criterion.weight}%</td>
                      <td className="px-md py-sm text-right tabular-nums">
                        {formatScore(criterion.averageScore)}
                      </td>
                      <td className="px-md py-sm text-right tabular-nums">
                        {formatScore(criterion.weightedScore)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
