import type { ApiResponse } from "../types/api";
import { apiClient } from "./apiClient";

export interface DemoRegistrationSeedResponse {
  eventId: number;
  existingRealTeamCount: number;
  regularTeamsCreated: number;
  singleMemberTeamsCreated: number;
  teamsSkipped: number;
  usersCreated: number;
  usersReused: number;
  membersCreated: number;
  totalTeamsAfterSeed: number;
  eventQuota: number;
  expectedConfirmedAfterApproval: number;
  expectedWaitlistAfterApproval: number;
  warnings: string[];
}

export interface HistoricalDemoSeedResponse {
  termsCreated: number;
  termsReused: number;
  eventsCreated: number;
  eventsReused: number;
  teamsCreated: number;
  usersCreated: number;
  usersReused: number;
  scoreSheetsCreated: number;
  rankingResultsCreated: number;
  awardsCreated: number;
  warnings: string[];
}

export async function seedDemoRegistrations(eventId: number) {
  const { data } = await apiClient.post<ApiResponse<DemoRegistrationSeedResponse>>(
    `/v1/admin/events/${eventId}/demo-seed/registrations`
  );
  if (!data.data) {
    throw new Error(data.message || "Không tạo được đội demo.");
  }
  return data.data;
}

export async function seedHistoricalDemoData() {
  const { data } = await apiClient.post<ApiResponse<HistoricalDemoSeedResponse>>(
    "/v1/admin/demo-seed/historical-data"
  );
  if (!data.data) {
    throw new Error(data.message || "Không tạo được dữ liệu lịch sử demo.");
  }
  return data.data;
}
