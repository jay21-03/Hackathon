import { useMyTeam } from "./useMyTeam";

/** Kiểm tra đội đã CONFIRMED — dùng cho trang bảng thi / đề thi */
export function useTeamGate(eventId: number | null) {
  const { team, loading, error } = useMyTeam(eventId);

  const hasTeam = Boolean(team);
  const isConfirmed = team?.status === "CONFIRMED";

  return {
    team,
    loading,
    error,
    hasTeam,
    isConfirmed,
    canAccessContestViews: isConfirmed
  };
}
