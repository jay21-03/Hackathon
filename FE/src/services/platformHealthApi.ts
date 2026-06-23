import { apiClient } from "./apiClient";
import type { ApiResponse } from "../types/api";

export interface SchedulerHealthResponse {
  githubSchedulerEnabled: boolean;
  aiReviewSchedulerEnabled: boolean;
  eventLifecycleSchedulerEnabled: boolean;
  recommendation?: string | null;
}

export async function fetchSchedulerHealth() {
  const { data } = await apiClient.get<ApiResponse<SchedulerHealthResponse>>(
    "/v1/admin/platform/scheduler-health"
  );
  if (!data.data) {
    throw new Error(data.message || "Không tải trạng thái scheduler.");
  }
  return data.data;
}
