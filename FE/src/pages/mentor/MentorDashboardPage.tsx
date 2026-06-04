import { useQuery } from "@tanstack/react-query";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { fetchMentorAssignments } from "../../services/assignmentService";
import { getApiErrorMessage } from "../../utils/apiError";

export function MentorDashboardPage() {
  const query = useQuery({
    queryKey: ["assignments", "mentor"],
    queryFn: fetchMentorAssignments
  });

  const assignments = query.data ?? [];
  const error = query.isError
    ? getApiErrorMessage(query.error, "Không tải được danh sách phân công mentor.")
    : null;

  if (query.isLoading) return <ModuleSkeleton rows={4} />;

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Mentor"
        title="Bảng được phân công"
        description="Theo dõi các bảng bạn phụ trách. Chi tiết đội và AI review sẽ mở khi backend bổ sung API."
        actions={<Badge tone={error ? "danger" : "success"}>{error ? "Lỗi tải dữ liệu" : "Dữ liệu hệ thống"}</Badge>}
      />

      {error ? (
        <div className="rounded-xl border border-error/40 bg-error-container/40 p-md">
          <p className="font-body-sm text-on-surface-variant">{error}</p>
        </div>
      ) : null}

      <section className="grid gap-md md:grid-cols-2">
        <StatCard
          label="Phân công"
          value={assignments.length}
          helper="Từ API /mentors/assignments"
          icon="view_module"
        />
        <StatCard
          label="Bảng khác nhau"
          value={new Set(assignments.map((item) => item.boardId)).size}
          helper="Mỗi bảng một phân công"
          icon="groups"
          tone="success"
        />
      </section>

      {assignments.length === 0 && !error ? (
        <EmptyState
          icon="view_module"
          title="Chưa có phân công"
          description="Ban tổ chức sẽ gán mentor cho bảng tại trang Phân công."
        />
      ) : (
        <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="table-header-bg">
                <tr className="font-label-sm text-on-surface-variant">
                  <th className="px-md py-sm">Bảng</th>
                  <th className="px-md py-sm">Gán lúc</th>
                  <th className="px-md py-sm">Gán bởi</th>
                </tr>
              </thead>
              <tbody className="table-divider">
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="font-body-sm text-on-surface">
                    <td className="px-md py-md font-label-md">Bảng #{assignment.boardId}</td>
                    <td className="px-md py-md">
                      {new Date(assignment.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-md py-md">BTC #{assignment.createdBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
