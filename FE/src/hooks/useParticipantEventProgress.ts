import { useMyBoard } from "./useMyBoard";
import { useMyTeam } from "./useMyTeam";

export type ProgressStepState = "done" | "active" | "blocked" | "next";

export function useParticipantEventProgress(eventId: number | null) {
  const { team, loading: teamLoading } = useMyTeam(eventId);
  const { board, loading: boardLoading } = useMyBoard(eventId);

  const isConfirmed = team?.status === "CONFIRMED";
  const hasBoard = Boolean(board?.assigned);

  const steps: { label: string; state: ProgressStepState }[] = [
    {
      label: "Đội",
      state: team ? (isConfirmed ? "done" : "active") : "blocked"
    },
    {
      label: "Bảng",
      state: !team ? "blocked" : hasBoard ? "done" : isConfirmed ? "active" : "blocked"
    },
    {
      label: "Đề",
      state: !team || !hasBoard ? "blocked" : isConfirmed ? "next" : "blocked"
    }
  ];

  return {
    team,
    board,
    steps,
    loading: teamLoading || boardLoading,
    isConfirmed,
    hasBoard
  };
}
