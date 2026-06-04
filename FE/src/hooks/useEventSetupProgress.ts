import { useQuery } from "@tanstack/react-query";
import type { WorkflowStep } from "../components/ui/WorkflowSteps";
import { useEventTeams } from "./useEventTeams";
import { queryKeys } from "../lib/queryKeys";
import { fetchBoardProblems, fetchEventRounds, fetchRoundBoards } from "../services/contestApi";

export function useEventSetupProgress(eventId: number | null) {
  const { teams, loading: teamsLoading } = useEventTeams(eventId);

  const setupQuery = useQuery({
    queryKey: [...queryKeys.rounds.byEvent(eventId), "setup-progress"],
    enabled: Boolean(eventId),
    queryFn: async () => {
      const rounds = await fetchEventRounds(eventId!);
      const round = rounds[0];
      const boards = round ? await fetchRoundBoards(round.id) : [];
      let hasProblem = false;
      if (boards[0]) {
        const problems = await fetchBoardProblems(boards[0].id);
        hasProblem = problems.length > 0;
      }
      return { boardsCount: boards.length, hasProblem };
    }
  });

  const hasTeams = teams.length > 0;
  const hasBoards = (setupQuery.data?.boardsCount ?? 0) > 0;
  const hasProblem = setupQuery.data?.hasProblem ?? false;

  const steps: WorkflowStep[] = [
    {
      label: "Thông tin",
      detail: "Tên, quota, mở đăng ký",
      to: "/organizer/events/basic-info",
      state: "active"
    },
    {
      label: "Đăng ký đội",
      detail: "Duyệt đội và danh sách chờ",
      to: "/organizer/registrations",
      state: hasTeams ? "done" : "next"
    },
    {
      label: "Lời mời thành viên",
      detail: "Trạng thái thư mời sau khi có đội",
      to: "/organizer/invitations",
      state: hasTeams ? "next" : "blocked"
    },
    {
      label: "Bảng thi",
      detail: "Vòng, bảng, slot, gán đội",
      to: "/organizer/boards",
      state: hasBoards ? "done" : hasTeams ? "next" : "blocked"
    },
    {
      label: "Đề thi",
      detail: "Cấu hình mở đề theo bảng",
      to: "/organizer/problems",
      state: hasProblem ? "done" : hasBoards ? "next" : "blocked"
    },
    {
      label: "Phân công",
      detail: "Mentor và giám khảo",
      to: "/organizer/assignments",
      state: hasBoards ? "next" : "blocked"
    }
  ];

  return {
    steps,
    loading: teamsLoading || setupQuery.isLoading
  };
}
