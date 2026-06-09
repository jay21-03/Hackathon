import { useQuery } from "@tanstack/react-query";
import { StaffAssignmentDashboard } from "../../components/staff/StaffAssignmentDashboard";
import { WorkflowSteps } from "../../components/ui/WorkflowSteps";
import { buildJudgeWorkflowSteps } from "../../domain/judgeWorkflow";
import { fetchJudgeAssignments } from "../../services/assignmentService";

export function JudgeDashboardPage() {
  const query = useQuery({
    queryKey: ["assignments", "judge"],
    queryFn: fetchJudgeAssignments
  });

  const assignments = query.data ?? [];

  return (
    <StaffAssignmentDashboard
      eyebrow="Giám khảo"
      title="Bảng cần chấm"
      description="Giám khảo chỉ chấm đội thuộc bảng đã phân công. Mở ma trận chấm điểm cho từng bảng."
      assignments={assignments}
      loading={query.isLoading}
      error={query.error}
      scorePath={(boardId) => `/judge/scoring?boardId=${boardId}`}
      emptyTitle="Chưa có phân công"
      emptyDescription="Ban tổ chức sẽ gán giám khảo cho bảng tại trang Phân công."
      workflow={
        <WorkflowSteps
          title="Quy trình chấm"
          description="Chọn bảng từ danh sách rồi mở phiếu chấm."
          steps={buildJudgeWorkflowSteps("dashboard", assignments.length > 0)}
        />
      }
    />
  );
}
