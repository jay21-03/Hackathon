import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { fetchAdminUsers, type UserSummaryResponse } from "../services/userService";
import { resolveApiError } from "../utils/apiError";

export function useUserManagement(page = 0, size = 100, query = "") {
  const queryClient = useQueryClient();
  const normalizedQuery = query.trim();

  const usersQuery = useQuery({
    queryKey: [...queryKeys.users.admin(), page, size, normalizedQuery],
    queryFn: () => fetchAdminUsers({ page, size, q: normalizedQuery || undefined })
  });

  async function invalidate() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.users.admin() });
  }

  return {
    users: usersQuery.data?.items ?? [],
    total: usersQuery.data?.total ?? 0,
    totalPages: usersQuery.data?.totalPages ?? 0,
    page: usersQuery.data?.page ?? page,
    loading: usersQuery.isLoading,
    error: usersQuery.error
      ? resolveApiError(usersQuery.error, "Không tải được danh sách người dùng.")
      : null,
    invalidate
  };
}

export type { UserSummaryResponse };
