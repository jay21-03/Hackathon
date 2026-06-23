import { useQuery } from "@tanstack/react-query";
import { JudgeAssignmentDashboard } from "../../components/judge/JudgeAssignmentDashboard";
import { fetchJudgeAssignments } from "../../services/assignmentService";

export function JudgeDashboardPage() {
  const query = useQuery({
    queryKey: ["assignments", "judge"],
    queryFn: fetchJudgeAssignments
  });

  return (
    <JudgeAssignmentDashboard
      assignments={query.data ?? []}
      loading={query.isLoading}
      error={query.error}
      onRetry={() => void query.refetch()}
      scorePath={(boardId) => `/judge/scoring?boardId=${boardId}`}
    />
  );
}
