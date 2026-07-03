import { Button } from "../ui/Button";
import { JudgeTeamScoreStatusBanner } from "./JudgeTeamScoreStatusBanner";
import { getTeamScoreStatus } from "./judgeTeamScoreStatus";
import type { MatrixTeamRowResponse } from "../../services/scoringApi";

interface JudgeTeamListTableProps {
  teams: MatrixTeamRowResponse[];
  criteriaCount: number;
  onScoreTeam: (teamId: number) => void;
}

export function JudgeTeamListTable({ teams, criteriaCount, onScoreTeam }: JudgeTeamListTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container">
      <table className="min-w-full border-collapse font-body-sm">
        <thead>
          <tr className="border-b border-outline-variant bg-surface-container-high text-left">
            <th className="px-md py-sm font-label-sm text-on-surface-variant">Đội</th>
            <th className="px-md py-sm font-label-sm text-on-surface-variant">Vị trí</th>
            <th className="min-w-[16rem] px-md py-sm font-label-sm text-on-surface-variant">Trạng thái phiếu</th>
            <th className="px-md py-sm font-label-sm text-on-surface-variant">Tổng điểm</th>
            <th className="px-md py-sm font-label-sm text-on-surface-variant" />
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => {
            const scoreStatus = getTeamScoreStatus(team, criteriaCount);
            return (
              <tr key={team.teamId} className="border-b border-outline-variant/60 last:border-b-0">
                <td className="px-md py-sm font-label-md text-on-surface">{team.teamName}</td>
                <td className="px-md py-sm text-on-surface-variant">#{team.slotNumber}</td>
                <td className="px-md py-sm">
                  <JudgeTeamScoreStatusBanner status={scoreStatus} compact />
                </td>
                <td className="px-md py-sm text-on-surface">
                  {team.computed?.judgeTeamScore != null
                    ? Number(team.computed.judgeTeamScore).toFixed(2)
                    : "—"}
                </td>
                <td className="px-md py-sm text-right">
                  <Button type="button" size="sm" variant="primary" onClick={() => onScoreTeam(team.teamId)}>
                    {team.status === "SUBMITTED" ? "Xem phiếu" : "Chấm điểm"}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
