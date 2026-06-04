import { useEffect, useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { fetchMentorAssignments, type AssignmentResponse } from "../../services/assignmentService";

export function MentorDashboardPage() {
  const [assignments, setAssignments] = useState<AssignmentResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMentorAssignments()
      .then((result) => {
        setAssignments(result);
      })
      .catch(() => {
        setError("Không tải được danh sach phân công mentor.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ModuleSkeleton rows={4} />;

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Mentor"
        title="Đội thi duoc phu trach"
        description="Mentor theo dõi tien do kho ma nguon, danh gia AI va ho tro doi trong bang duoc phân công."
        actions={<Badge tone={error ? "danger" : "success"}>{error ? "Loi API" : "Du lieu he thong"}</Badge>}
      />

      {error ? (
        <div className="rounded-xl border border-error/40 bg-error-container/40 p-md">
          <p className="font-body-sm text-on-surface-variant">{error}</p>
        </div>
      ) : null}

      <section className="grid gap-md md:grid-cols-3">
        <StatCard label="Phân công" value={assignments.length} helper="Từ BE /mentors/assignments" icon="view_module" />
        <StatCard label="Bang da gan" value={new Set(assignments.map((item) => item.boardId)).size} helper="Moi board mot phân công" icon="groups" tone="success" />
        <StatCard label="Mentor ID" value={assignments[0]?.assigneeId ?? "-"} helper="Tài khoản hien tai" icon="badge" tone="warning" />
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
    </div>
  );
}
