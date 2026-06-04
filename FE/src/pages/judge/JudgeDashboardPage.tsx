import { useEffect, useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { fetchJudgeAssignments, type AssignmentResponse } from "../../services/assignmentService";

export function JudgeDashboardPage() {
  const [assignments, setAssignments] = useState<AssignmentResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJudgeAssignments()
      .then((result) => {
        setAssignments(result);
      })
      .catch(() => {
        setError("Không tải được danh sach phân công giám khảo.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ModuleSkeleton rows={4} />;

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Giám khảo"
        title="Đội thi can cham"
        description="Giám khảo chi cham doi thuoc bang da phân công. Diem phai duoc chot chinh thuc moi tinh xep hang."
        actions={<Badge tone={error ? "danger" : "success"}>{error ? "Loi API" : "Du lieu he thong"}</Badge>}
      />

      <section className="grid gap-md md:grid-cols-3">
        <StatCard label="Phân công" value={assignments.length} helper="Từ BE /judges/assignments" icon="groups" />
        <StatCard label="Board" value={new Set(assignments.map((item) => item.boardId)).size} helper="Moi board mot judge" icon="view_module" tone="success" />
        <StatCard label="Judge ID" value={assignments[0]?.assigneeId ?? "-"} helper="Tài khoản hien tai" icon="badge" tone="warning" />
      </section>

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="table-header-bg">
              <tr className="font-label-sm text-on-surface-variant">
                <th className="px-md py-sm">Board</th>
                <th className="px-md py-sm">Assignee</th>
                <th className="px-md py-sm">Assigned at</th>
                <th className="px-md py-sm">Created by</th>
              </tr>
            </thead>
            <tbody className="table-divider">
              {assignments.map((assignment) => (
                <tr key={assignment.id} className="font-body-sm text-on-surface">
                  <td className="px-md py-md font-label-md">#{assignment.boardId}</td>
                  <td className="px-md py-md">#{assignment.assigneeId}</td>
                  <td className="px-md py-md">{new Date(assignment.createdAt).toLocaleString("vi-VN")}</td>
                  <td className="px-md py-md">#{assignment.createdBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {error ? <Badge tone="danger">{error}</Badge> : null}
    </div>
  );
}
