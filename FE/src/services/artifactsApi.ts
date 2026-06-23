import type { ApiResponse } from "../types/api";
import { apiClient } from "./apiClient";
import type { RepositoryStatusStats } from "./repositoryProvisioningService";

export interface EventSubmissionSummary {
  totalTeams: number;
  submittedCount: number;
  draftCount: number;
}

export interface EventArtifactsSummary {
  submissions: EventSubmissionSummary;
  repositories: RepositoryStatusStats;
}

export async function fetchEventArtifactsSummary(eventId: number) {
  const { data } = await apiClient.get<ApiResponse<EventArtifactsSummary>>(
    `/v1/admin/events/${eventId}/artifacts-summary`
  );
  if (!data.data) {
    throw new Error(data.message || "Không tải được tóm tắt bài nộp & mã nguồn.");
  }
  return data.data;
}
