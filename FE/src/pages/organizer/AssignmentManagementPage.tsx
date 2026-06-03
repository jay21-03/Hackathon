import { useEffect, useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import type { DemoBoard } from "../../services/demoDataService";
import { fetchBoardAssignments } from "../../services/hackathonApi";

export function AssignmentManagementPage() {
  const [boards, setBoards] = useState<DemoBoard[]>([]);
  const [usingFallback, setUsingFallback] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBoardAssignments()
      .then((result) => {
        setBoards(result.data);
        setUsingFallback(result.usingFallback);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ModuleSkeleton rows={4} />;

  const judgeCount = new Set(boards.flatMap((board) => board.judges)).size;

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Phan cong"
        title="Mentor va giam khao theo bang"
        description="Moi bang co mentor phu trach va danh sach giam khao rieng. Judge chi cham doi thuoc bang duoc phan cong."
        actions={usingFallback ? <Badge tone="warning">Dang dung demo data</Badge> : <Badge tone="success">Da noi API</Badge>}
      />

      <section className="grid gap-md md:grid-cols-3">
        <StatCard label="Bang thi" value={boards.length} helper="Theo vong so loai" icon="view_module" />
        <StatCard label="Mentor" value={new Set(boards.map((board) => board.mentor)).size} helper="Da phan cong" icon="groups" tone="success" />
        <StatCard label="Giam khao" value={judgeCount} helper="Khong cham ngoai bang" icon="gavel" tone="warning" />
      </section>

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="table-header-bg">
              <tr className="font-label-sm text-on-surface-variant">
                <th className="px-md py-sm">Bang</th>
                <th className="px-md py-sm">Vong</th>
                <th className="px-md py-sm">So doi</th>
                <th className="px-md py-sm">Mentor</th>
                <th className="px-md py-sm">Giam khao</th>
                <th className="px-md py-sm">Trang thai</th>
              </tr>
            </thead>
            <tbody className="table-divider">
              {boards.map((board) => (
                <tr key={board.id} className="font-body-sm text-on-surface">
                  <td className="px-md py-md font-label-md">{board.name}</td>
                  <td className="px-md py-md">{board.round}</td>
                  <td className="px-md py-md">{board.teamIds.length}</td>
                  <td className="px-md py-md">{board.mentor}</td>
                  <td className="px-md py-md">{board.judges.join(", ")}</td>
                  <td className="px-md py-md">
                    <Badge tone={getStatusTone(board.status)}>{getStatusLabel(board.status)}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
