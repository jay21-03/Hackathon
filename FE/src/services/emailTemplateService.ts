import type { ApiResponse } from "../types/api";
import { apiClient } from "./apiClient";

export type EmailTemplateKey =
  | "STAFF_INVITATION"
  | "TEAM_INVITATION"
  | "STAFF_REMINDER"
  | "TEAM_REMINDER";

export interface EmailTemplateResponse {
  templateKey: EmailTemplateKey;
  subject: string;
  bodyHtml: string;
  source: string;
  customized: boolean;
}

export const TEMPLATE_LABELS: Record<EmailTemplateKey, string> = {
  STAFF_INVITATION: "Mời Mentor/Giám khảo",
  TEAM_INVITATION: "Mời thành viên đội",
  STAFF_REMINDER: "Nhắc staff sắp hết hạn",
  TEAM_REMINDER: "Nhắc thành viên sắp hết hạn"
};

export const TEMPLATE_VARIABLES =
  "{eventName}, {boardName}, {teamName}, {roleLabel}, {expiresAt}, {acceptUrl}, {declineUrl}, {trackingPixelUrl}";

export async function fetchEmailTemplates(eventId: number) {
  const { data } = await apiClient.get<ApiResponse<EmailTemplateResponse[]>>(
    `/v1/events/${eventId}/email-templates`
  );
  return data.data ?? [];
}

export async function fetchEmailTemplate(eventId: number, templateKey: EmailTemplateKey) {
  const { data } = await apiClient.get<ApiResponse<EmailTemplateResponse>>(
    `/v1/events/${eventId}/email-templates/${templateKey}`
  );
  if (!data.data) {
    throw new Error(data.message || "Không tải được mẫu email.");
  }
  return data.data;
}

export async function saveEmailTemplate(
  eventId: number,
  templateKey: EmailTemplateKey,
  body: { subject: string; bodyHtml: string }
) {
  const { data } = await apiClient.put<ApiResponse<EmailTemplateResponse>>(
    `/v1/events/${eventId}/email-templates/${templateKey}`,
    body
  );
  if (!data.data) {
    throw new Error(data.message || "Không lưu được mẫu email.");
  }
  return data.data;
}

export async function resetEmailTemplate(eventId: number, templateKey: EmailTemplateKey) {
  const { data } = await apiClient.post<ApiResponse<EmailTemplateResponse>>(
    `/v1/events/${eventId}/email-templates/${templateKey}/reset`
  );
  if (!data.data) {
    throw new Error(data.message || "Không khôi phục được mẫu mặc định.");
  }
  return data.data;
}
