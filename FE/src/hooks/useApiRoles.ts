import { useQuery } from "@tanstack/react-query";
import { resolveRoleFromApiRoles } from "../auth/authSession";
import { fetchCurrentUser } from "../services/userService";

export function useApiRoles() {
  const query = useQuery({
    queryKey: ["me", "roles"],
    queryFn: fetchCurrentUser,
    staleTime: 30_000,
    retry: 1
  });

  const roles = (query.data?.roles ?? []).map((r) => r.toUpperCase());

  return {
    user: query.data,
    roles,
    hasOrganizer: roles.includes("ORGANIZER"),
    hasMentor: roles.includes("MENTOR"),
    hasJudge: roles.includes("JUDGE"),
    suggestedRole: resolveRoleFromApiRoles(query.data?.roles),
    loading: query.isLoading,
    error: query.isError
  };
}
