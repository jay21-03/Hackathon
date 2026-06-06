import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";
import type { PublicEventResults } from "../../services/rankingApi";

interface EventResultsViewProps {
  results: PublicEventResults;
  participantView?: boolean;
  /** Highlight đội của thí sinh đang xem */
  highlightTeamId?: number | null;
}

export function EventResultsView({ results, participantView, highlightTeamId }: EventResultsViewProps) {
  if (!results.published || results.boards.length === 0) {
    return (
      <EmptyState
        icon="leaderboard"
        title={participantView ? "Chưa có kết quả" : "Chưa công bố"}
        description={
          participantView
            ? "Ban tổ chức sẽ công bố bảng xếp hạng sau khi hoàn tất chấm điểm."
            : "Cuộc thi này chưa công bố kết quả chính thức."
        }
      />
    );
  }

  return (
    <div className="space-y-lg">
      <div className="flex flex-wrap items-center gap-md">
        <Badge tone="success">Đã công bố</Badge>
        {results.publishedAt ? (
          <span className="font-body-sm text-on-surface-variant">
            Công bố lúc {new Date(results.publishedAt).toLocaleString("vi-VN")}
          </span>
        ) : null}
      </div>

      {results.boards.map((board) => (
        <section
          key={board.boardId}
          className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container"
        >
          <div className="border-b border-outline-variant px-md py-sm">
            <h2 className="font-headline-sm text-on-surface">{board.boardName}</h2>
            {board.roundName ? (
              <p className="font-body-sm text-on-surface-variant">{board.roundName}</p>
            ) : null}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="table-header-bg">
                <tr className="font-label-sm text-on-surface-variant">
                  <th className="px-md py-sm">Hạng</th>
                  <th className="px-md py-sm">Đội</th>
                  <th className="px-md py-sm">Điểm TB</th>
                  <th className="px-md py-sm">GK đã nộp</th>
                </tr>
              </thead>
              <tbody className="table-divider">
                {board.entries.map((row) => {
                  const isOwnTeam = highlightTeamId != null && row.teamId === highlightTeamId;
                  return (
                    <tr
                      key={row.teamId}
                      className={`font-body-sm text-on-surface ${isOwnTeam ? "bg-primary-container/30" : ""}`}
                    >
                      <td className="px-md py-md font-headline-sm">
                        {row.rank}
                        {isOwnTeam ? (
                          <Badge tone="active" className="ml-sm">
                            Đội bạn
                          </Badge>
                        ) : null}
                      </td>
                      <td className="px-md py-md font-label-md">{row.teamName}</td>
                      <td className="px-md py-md">{Number(row.averageScore).toFixed(2)}</td>
                      <td className="px-md py-md">{row.submittedJudgeCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
