import type { ApiResponse } from "../types/api";
import type { AcademicTerm, AcademicTermStatus, AcademicTermType } from "../types/entities";
import { apiClient } from "./apiClient";

export interface CreateAcademicTermPayload {
  code: string;
  name: string;
  year: number;
  termType: AcademicTermType;
  startDate: string;
  endDate: string;
  status?: AcademicTermStatus;
}

export interface UpdateAcademicTermPayload {
  name?: string;
  startDate?: string;
  endDate?: string;
  status?: AcademicTermStatus;
}

export interface TermScopedList<T> {
  academicTerm: { id: number; code: string; name: string };
  items: T[];
  totalElements: number;
  page?: number;
  size?: number;
  totalPages?: number;
}

export interface TermParticipant {
  id: number;
  teamId: number;
  eventId: number;
  email: string;
  fullName: string;
  status: string | null;
}

export interface TermUserSummary {
  id: number;
  email: string;
  fullName: string;
  roles?: string[];
}

async function fetchTermScopedList<T>(
  path: string,
  page?: number,
  size?: number
): Promise<TermScopedList<T> | null> {
  const { data } = await apiClient.get<ApiResponse<TermScopedList<T>>>(path, {
    params: page != null || size != null ? { page: page ?? 0, size: size ?? 50 } : undefined
  });
  return data.data ?? null;
}

export async function fetchAcademicTerms(status?: AcademicTermStatus): Promise<AcademicTerm[]> {
  const { data } = await apiClient.get<ApiResponse<AcademicTerm[]>>("/v1/admin/academic-terms", {
    params: status ? { status } : undefined
  });
  return data.data ?? [];
}

export async function fetchAcademicTerm(termId: number): Promise<AcademicTerm | null> {
  const { data } = await apiClient.get<ApiResponse<AcademicTerm>>(`/v1/admin/academic-terms/${termId}`);
  return data.data ?? null;
}

export async function createAcademicTerm(payload: CreateAcademicTermPayload): Promise<AcademicTerm> {
  const { data } = await apiClient.post<ApiResponse<AcademicTerm>>("/v1/admin/academic-terms", payload);
  if (!data.data) {
    throw new Error(data.message || "Không tạo được học kỳ");
  }
  return data.data;
}

export async function updateAcademicTerm(
  termId: number,
  payload: UpdateAcademicTermPayload
): Promise<AcademicTerm> {
  const { data } = await apiClient.put<ApiResponse<AcademicTerm>>(
    `/v1/admin/academic-terms/${termId}`,
    payload
  );
  if (!data.data) {
    throw new Error(data.message || "Không cập nhật được học kỳ");
  }
  return data.data;
}

export interface TermDashboard {
  academicTerm: { id: number; code: string; name: string };
  eventCount: number;
  teamCount: number;
  participantCount: number;
  mentorCount: number;
  judgeCount: number;
  rankingCount: number;
  repositoryCount: number;
  scoreSheetCount: number;
}

export interface TermEventItem {
  id: number;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
}

export interface TermTeamItem {
  id: number;
  eventId: number;
  name: string;
  status: string;
}

export interface TermRankingItem {
  id: number;
  roundId: number;
  boardId: number;
  teamId: number;
  rank: number;
  averageScore: number;
}

export interface TermRepositoryItem {
  id: number;
  teamId: number;
  roundId: number;
  boardId: number;
  repositoryUrl: string | null;
  provisionStatus: string | null;
}

export interface TermScoreSheetItem {
  id: number;
  boardId: number;
  teamId: number;
  judgeId: number;
  status: string | null;
}

export async function fetchTermDashboard(termId: number): Promise<TermDashboard | null> {
  const { data } = await apiClient.get<ApiResponse<TermDashboard>>(
    `/v1/admin/academic-terms/${termId}/dashboard`
  );
  return data.data ?? null;
}

export function fetchTermEvents(termId: number, page?: number, size?: number) {
  return fetchTermScopedList<TermEventItem>(
    `/v1/admin/academic-terms/${termId}/events`,
    page,
    size
  );
}

export function fetchTermTeams(termId: number, page?: number, size?: number) {
  return fetchTermScopedList<TermTeamItem>(
    `/v1/admin/academic-terms/${termId}/teams`,
    page,
    size
  );
}

export function fetchTermRankings(termId: number, page?: number, size?: number) {
  return fetchTermScopedList<TermRankingItem>(
    `/v1/admin/academic-terms/${termId}/rankings`,
    page,
    size
  );
}

export function fetchTermRepositories(termId: number, page?: number, size?: number) {
  return fetchTermScopedList<TermRepositoryItem>(
    `/v1/admin/academic-terms/${termId}/repositories`,
    page,
    size
  );
}

export function fetchTermScoreSheets(termId: number, page?: number, size?: number) {
  return fetchTermScopedList<TermScoreSheetItem>(
    `/v1/admin/academic-terms/${termId}/score-sheets`,
    page,
    size
  );
}

export function fetchTermParticipants(termId: number, page?: number, size?: number) {
  return fetchTermScopedList<TermParticipant>(
    `/v1/admin/academic-terms/${termId}/participants`,
    page,
    size
  );
}

export function fetchTermMentors(termId: number, page?: number, size?: number) {
  return fetchTermScopedList<TermUserSummary>(
    `/v1/admin/academic-terms/${termId}/mentors`,
    page,
    size
  );
}

export function fetchTermJudges(termId: number, page?: number, size?: number) {
  return fetchTermScopedList<TermUserSummary>(
    `/v1/admin/academic-terms/${termId}/judges`,
    page,
    size
  );
}

export function fetchTermMentorCandidates(termId: number, page?: number, size?: number) {
  return fetchTermScopedList<TermUserSummary>(
    `/v1/admin/academic-terms/${termId}/mentors/candidates`,
    page,
    size
  );
}

export function fetchTermJudgeCandidates(termId: number, page?: number, size?: number) {
  return fetchTermScopedList<TermUserSummary>(
    `/v1/admin/academic-terms/${termId}/judges/candidates`,
    page,
    size
  );
}
