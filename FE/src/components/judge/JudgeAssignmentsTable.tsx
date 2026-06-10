import { Badge } from "../ui/Badge";
import { ButtonLink } from "../ui/Button";
import type { AssignmentResponse } from "../../services/assignmentService";
import {
  canOpenScoringMatrix,
  formatBoardAssignmentLabel,
  formatScoringProgress,
  readinessLabel,
  readinessTone,
  scoringCtaLabel
} from "../../utils/judgeAssignmentUtils";

interface JudgeAssignmentsTableProps {
  assignments: AssignmentResponse[];
  scorePath: (boardId: number) => string;
}

export function JudgeAssignmentsTable({ assignments, scorePath }: JudgeAssignmentsTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container">
      <table className="min-w-full border-collapse font-body-sm">
        <thead>
          <tr className="border-b border-outline-variant bg-surface-container-high text-left">
            <th className="px-md py-sm font-label-sm text-on-surface-variant">Cuộc thi</th>
            <th className="px-md py-sm font-label-sm text-on-surface-variant">Vòng</th>
            <th className="px-md py-sm font-label-sm text-on-surface-variant">Bảng</th>
            <th className="px-md py-sm font-label-sm text-on-surface-variant">Tiến độ</th>
            <th className="px-md py-sm font-label-sm text-on-surface-variant">Trạng thái</th>
            <th className="px-md py-sm font-label-sm text-on-surface-variant">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((item) => (
            <tr key={item.id} className="border-b border-outline-variant/60 last:border-b-0">
              <td className="px-md py-sm text-on-surface">{item.eventName ?? "—"}</td>
              <td className="px-md py-sm text-on-surface">{item.roundName ?? "—"}</td>
              <td className="px-md py-sm text-on-surface" title={formatBoardAssignmentLabel(item)}>
                {item.boardName ?? `Bảng #${item.boardId}`}
              </td>
              <td className="px-md py-sm text-on-surface-variant">{formatScoringProgress(item)}</td>
              <td className="px-md py-sm">
                <Badge tone={readinessTone(item.readiness)}>{readinessLabel(item.readiness)}</Badge>
              </td>
              <td className="px-md py-sm">
                {canOpenScoringMatrix(item) ? (
                  <ButtonLink to={scorePath(item.boardId)} variant="primary" size="sm">
                    {scoringCtaLabel(item)}
                  </ButtonLink>
                ) : (
                  <span className="font-label-sm text-on-surface-variant">Chờ BTC thiết lập</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
