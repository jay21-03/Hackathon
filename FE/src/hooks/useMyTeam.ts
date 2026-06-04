import { useEffect, useState } from "react";
import { fetchMyTeams, type TeamDetailResponse } from "../services/registrationService";

export function useMyTeam(eventId: number | null) {
  const [teams, setTeams] = useState<TeamDetailResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setTeams([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchMyTeams(eventId)
      .then((result) => {
        if (!cancelled) setTeams(result);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Khong tai duoc thong tin doi.");
          setTeams([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const team = teams[0] ?? null;

  return { team, teams, loading, error, reload: () => setTeams([...teams]) };
}
