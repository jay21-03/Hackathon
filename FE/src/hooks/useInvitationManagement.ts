import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import {
  fetchStaffInvitations,
  type StaffInvitationStatus,
  type StaffRole
} from "../services/staffInvitationService";
import {
  fetchTeamInvitations,
  type TeamInvitationStatus
} from "../services/registrationService";
import { resolveApiError } from "../utils/apiError";

export function useInvitationManagement(
  eventId: number | null,
  options?: {
    staffEnabled?: boolean;
    staffRoundId?: number | null;
    staffBoardId?: number | null;
    staffRole?: StaffRole | "";
    staffStatus?: StaffInvitationStatus | "";
    staffEmail?: string;
    staffPage?: number;
    staffSize?: number;
    teamEnabled?: boolean;
    teamStatus?: TeamInvitationStatus | "";
    teamEmail?: string;
    teamPage?: number;
    teamSize?: number;
  }
) {
  const queryClient = useQueryClient();
  const staffPage = options?.staffPage ?? 0;
  const staffSize = options?.staffSize ?? 25;
  const staffRoundId = options?.staffRoundId ?? null;
  const staffBoardId = options?.staffBoardId ?? null;
  const staffRole = options?.staffRole ?? "";
  const staffStatus = options?.staffStatus ?? "INVITED";
  const staffEmail = options?.staffEmail ?? "";
  const staffEnabled = options?.staffEnabled ?? true;

  const teamPage = options?.teamPage ?? 0;
  const teamSize = options?.teamSize ?? 25;
  const teamStatus = options?.teamStatus ?? "INVITED";
  const teamEmail = options?.teamEmail ?? "";
  const teamEnabled = options?.teamEnabled ?? true;

  const teamQuery = useQuery({
    queryKey: queryKeys.invitations.team(eventId, teamStatus, teamEmail, teamPage, teamSize),
    queryFn: () =>
      fetchTeamInvitations(eventId!, {
        status: teamStatus || null,
        email: teamEmail || null,
        page: teamPage,
        size: teamSize
      }),
    enabled: Boolean(eventId) && teamEnabled
  });

  const staffQuery = useQuery({
    queryKey: queryKeys.invitations.staff(
      eventId,
      staffRoundId,
      staffBoardId,
      staffRole,
      staffStatus,
      staffEmail,
      staffPage,
      staffSize
    ),
    queryFn: () =>
      fetchStaffInvitations(eventId!, {
        roundId: staffRoundId,
        boardId: staffBoardId,
        role: staffRole || null,
        status: staffStatus || null,
        email: staffEmail || null,
        page: staffPage,
        size: staffSize
      }),
    enabled: Boolean(eventId) && staffEnabled
  });

  async function invalidateAll() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.invitations.all });
  }

  return {
    teamItems: teamQuery.data?.items ?? [],
    teamTotal: teamQuery.data?.total ?? 0,
    teamTotalPages: teamQuery.data?.totalPages ?? 0,
    teamLoading: teamQuery.isLoading,
    teamError: teamQuery.error
      ? resolveApiError(teamQuery.error, "Không tải được danh sách lời mời thành viên.")
      : null,
    refetchTeam: teamQuery.refetch,
    staffItems: staffQuery.data?.items ?? [],
    staffTotal: staffQuery.data?.total ?? 0,
    staffTotalPages: staffQuery.data?.totalPages ?? 0,
    staffPage: staffQuery.data?.page ?? staffPage,
    staffLoading: staffQuery.isLoading,
    staffError: staffQuery.error
      ? resolveApiError(staffQuery.error, "Không tải được danh sách lời mời.")
      : null,
    refetchStaff: staffQuery.refetch,
    invalidateAll
  };
}
