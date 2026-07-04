import { useEffect, useMemo, useState } from "react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import type { BoardRanking, PublicEventResults } from "../../services/rankingApi";
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
  }, [results.eventId, roundGroups, myBoard?.boardId]);

  const activeRound = roundGroups.find((group) => group.key === roundKeySelected) ?? roundGroups[0];
  const boardsInRound = activeRound?.boards ?? [];
  const activeBoard =
    boardsInRound.find((board) => board.boardId === boardIdSelected) ?? boardsInRound[0] ?? null;

  useEffect(() => {
    if (!activeRound) return;
    if (!boardsInRound.some((board) => board.boardId === boardIdSelected)) {
      setBoardIdSelected(boardsInRound[0]?.boardId ?? null);
    }
  }, [activeRound?.key, boardsInRound, boardIdSelected]);

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
            <table className="min-w-full text-left table-fixed">
              <colgroup>
                <col className="w-24" />
                <col />
                <col className="w-28" />
                <col className="w-28" />
              </colgroup>
              <thead className="table-header-bg">
                <tr className="font-label-sm text-on-surface-variant">
                  <th className="px-md py-sm">Hạng</th>
                  <th className="px-md py-sm">Đội</th>
                  <th className="px-md py-sm text-right">Điểm TB</th>
                  <th className="px-md py-sm text-right">GK đã nộp</th>
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
                      <td className="px-md py-md font-headline-sm tabular-nums">
                        {row.rank}
                        {isOwnTeam ? (
                          <Badge tone="active" className="ml-sm align-middle">
                            Đội bạn
                          </Badge>
                        ) : null}
                      </td>
                      <td className="px-md py-md font-label-md">{row.teamName}</td>
                      <td className="px-md py-md text-right tabular-nums">
                        {Number(row.averageScore).toFixed(2)}
                      </td>
                      <td className="px-md py-md text-right tabular-nums">{row.submittedJudgeCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
