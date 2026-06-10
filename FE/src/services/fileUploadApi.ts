import type { ApiResponse } from "../types/api";
import { apiClient } from "./apiClient";

export interface FileUploadResponse {
  url: string;
  fileName: string;
  size: number;
  mimeType?: string | null;
}

export async function uploadProblemAttachment(eventId: number, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await apiClient.post<ApiResponse<FileUploadResponse>>(
    `/v1/admin/events/${eventId}/files`,
    formData,
    { timeout: 120_000 }
  );

  if (!data.data) {
    throw new Error(data.message || "Không tải được tệp lên");
  }
  return data.data;
}

export async function deleteProblemAttachment(eventId: number, url: string) {
  await apiClient.delete(`/v1/admin/events/${eventId}/files`, {
    params: { url }
  });
}
