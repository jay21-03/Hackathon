import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { enableAcademicTerms } from "../config/features";
import { queryKeys } from "../lib/queryKeys";
import {
  fetchTermJudgeCandidates,
  fetchTermMentorCandidates
} from "../services/academicTermService";
import { fetchAdminUsers, type UserSummaryResponse } from "../services/userService";

const POOL_PAGE_SIZE = 500;
const EMPTY_USERS: UserSummaryResponse[] = [];
const EMPTY_IDS: number[] = [];

function toUserSummary(item: {
  id: number;
  email: string;
  fullName: string;
  roles?: string[];
  status?: string;
}): UserSummaryResponse {
  return {
    id: item.id,
    email: item.email,
    fullName: item.fullName,
    status: item.status ?? "ACTIVE",
    roles: item.roles ?? [],
    createdAt: ""
  };
}

function excludeAssigned(
  pool: UserSummaryResponse[],
  assignedIds: number[]
): UserSummaryResponse[] {
  if (!assignedIds.length) return pool;
  const assigned = new Set(assignedIds);
  return pool.filter((user) => !assigned.has(user.id));
}

export function useTermStaffPool(options: {
  academicTermId: number | null | undefined;
  enabled?: boolean;
  assignedMentorIds?: number[];
  assignedJudgeIds?: number[];
}) {
  const {
    academicTermId,
    enabled = true,
    assignedMentorIds = EMPTY_IDS,
    assignedJudgeIds = EMPTY_IDS
  } = options;
  const termScoped = enableAcademicTerms && academicTermId != null;

  const termMentorsQuery = useQuery({
    queryKey: [...queryKeys.academicTerms.detail(academicTermId ?? null), "candidates", "mentors"],
    queryFn: async () => {
      const result = await fetchTermMentorCandidates(academicTermId!, 0, POOL_PAGE_SIZE);
      return (result?.items ?? []).map(toUserSummary);
    },
    enabled: enabled && termScoped
  });

  const termJudgesQuery = useQuery({
    queryKey: [...queryKeys.academicTerms.detail(academicTermId ?? null), "candidates", "judges"],
    queryFn: async () => {
      const result = await fetchTermJudgeCandidates(academicTermId!, 0, POOL_PAGE_SIZE);
      return (result?.items ?? []).map(toUserSummary);
    },
    enabled: enabled && termScoped
  });

  const allUsersQuery = useQuery({
    queryKey: [...queryKeys.assignments.all, "staff-pool-users"],
    queryFn: () => fetchAdminUsers({ page: 0, size: POOL_PAGE_SIZE }),
    enabled: enabled && !termScoped
  });

  const userItems = allUsersQuery.data?.items ?? EMPTY_USERS;
  const fallbackMentors = useMemo(
    () => userItems.filter((user) => user.roles.includes("MENTOR")),
    [userItems]
  );
  const fallbackJudges = useMemo(
    () => userItems.filter((user) => user.roles.includes("JUDGE")),
    [userItems]
  );

  const mentors = useMemo(() => {
    const pool = termScoped ? (termMentorsQuery.data ?? EMPTY_USERS) : fallbackMentors;
    return excludeAssigned(pool, assignedMentorIds);
  }, [termScoped, termMentorsQuery.data, fallbackMentors, assignedMentorIds]);

  const judges = useMemo(() => {
    const pool = termScoped ? (termJudgesQuery.data ?? EMPTY_USERS) : fallbackJudges;
    return excludeAssigned(pool, assignedJudgeIds);
  }, [termScoped, termJudgesQuery.data, fallbackJudges, assignedJudgeIds]);

  const loading = termScoped
    ? termMentorsQuery.isLoading || termJudgesQuery.isLoading
    : allUsersQuery.isLoading;

  const error = termScoped
    ? termMentorsQuery.error ?? termJudgesQuery.error
    : allUsersQuery.error;

  return {
    mentors,
    judges,
    termScoped,
    loading,
    error
  };
}
