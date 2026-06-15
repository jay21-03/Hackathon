import type { ApiResponse } from "../types/api";
import { apiClient } from "./apiClient";

export type AiReviewStatus = "PENDING" | "COMPLETED" | "FAILED";
export type AiReviewKind = "PER_PUSH" | "TEAM_AGGREGATE";

export interface AiReviewResponse {
  id: number;
  teamId: number;
  teamName?: string | null;
  roundId?: number | null;
  repoCommitId?: number | null;
  commitSha?: string | null;
  reviewKind?: AiReviewKind | null;
  status: AiReviewStatus;
  reviewScore?: number | null;
  summary?: string | null;
  issues?: string | null;
  suggestions?: string | null;
  ragLevel?: string | null;
  aiModel?: string | null;
  structuredOutput?: string | null;
  githubIssueUrl?: string | null;
  reviewedAt?: string | null;
  createdAt?: string | null;
}

export interface CriteriaComments {
  R1_01?: string;
  R1_02?: string;
  R1_03?: string;
  R1_04?: string;
  R1_05?: string;
  R2_01?: string;
  R2_02?: string;
  R2_03?: string;
  R2_04?: string;
  R2_05?: string;
}

export interface SmbScaleAdvisory {
  system_identity_recap?: string;
  summary?: string;
  tech_and_architecture?: string;
  cost_for_smb?: string;
  throughput_and_reliability?: string;
  observability_and_operations?: string;
  data_and_integrations?: string;
}

export interface ParsedStructuredReview {
  criteriaComments?: CriteriaComments | null;
  smbScaleAdvisory?: SmbScaleAdvisory | null;
  historicalSynthesis?: string | null;
  evolutionNotes?: string | null;
}

const R1_LABELS: Record<keyof CriteriaComments, string> = {
  R1_01: "R1 — Độ khớp giải pháp",
  R1_02: "R1 — Data Pipeline",
  R1_03: "R1 — Retrieval & Citation",
  R1_04: "R1 — Intent & Prompting",
  R1_05: "R1 — Tài liệu & Clean Code",
  R2_01: "R2 — Agent & Multi-hop",
  R2_02: "R2 — Quản lý tài nguyên Model",
  R2_03: "R2 — Vận hành Production",
  R2_04: "R2 — Mở rộng & Sáng tạo",
  R2_05: "R2 — Phản biện & Q&A"
};

export function rubricLabel(key: keyof CriteriaComments) {
  return R1_LABELS[key];
}

export async function fetchTeamAiReviews(teamId: number) {
  const { data } = await apiClient.get<ApiResponse<AiReviewResponse[]>>(`/v1/teams/${teamId}/ai-reviews`);
  return data.data ?? [];
}

export async function fetchLatestTeamAiReview(teamId: number) {
  const { data } = await apiClient.get<ApiResponse<AiReviewResponse | null>>(`/v1/teams/${teamId}/ai-review`);
  return data.data ?? null;
}

export async function fetchEventAiReviews(eventId: number) {
  const { data } = await apiClient.get<ApiResponse<AiReviewResponse[]>>(
    `/v1/admin/events/${eventId}/ai-reviews`
  );
  return data.data ?? [];
}

export async function triggerTeamAiReview(teamId: number) {
  const { data } = await apiClient.post<ApiResponse<AiReviewResponse>>(
    `/v1/admin/teams/${teamId}/ai-reviews/run`
  );
  if (!data.data) {
    throw new Error(data.message || "Không chạy được đánh giá AI.");
  }
  return data.data;
}

export interface BulkAiReviewFailure {
  teamId: number;
  teamName?: string | null;
  reason?: string | null;
}

export interface BulkAiReviewResponse {
  total: number;
  succeededCount: number;
  failedCount: number;
  succeeded: AiReviewResponse[];
  failed: BulkAiReviewFailure[];
}

export async function triggerEventAiReviews(eventId: number) {
  const { data } = await apiClient.post<ApiResponse<BulkAiReviewResponse>>(
    `/v1/admin/events/${eventId}/ai-reviews/run-all`
  );
  if (!data.data) {
    throw new Error(data.message || "Không chạy được đánh giá AI hàng loạt.");
  }
  return data.data;
}

export interface AiReviewBulkJobResponse {
  jobId: string;
  eventId: number;
  status: string;
  total: number;
  processed: number;
  succeededCount: number;
  failedCount: number;
  result?: BulkAiReviewResponse | null;
  errorMessage?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
}

export async function triggerEventAiReviewsAsync(eventId: number) {
  const { data } = await apiClient.post<ApiResponse<AiReviewBulkJobResponse>>(
    `/v1/admin/events/${eventId}/ai-reviews/run-all-async`
  );
  if (!data.data) {
    throw new Error(data.message || "Không khởi tạo job AI hàng loạt.");
  }
  return data.data;
}

export async function fetchAiReviewBulkJob(eventId: number, jobId: string) {
  const { data } = await apiClient.get<ApiResponse<AiReviewBulkJobResponse>>(
    `/v1/admin/events/${eventId}/ai-reviews/jobs/${jobId}`
  );
  if (!data.data) {
    throw new Error(data.message || "Không tải trạng thái job.");
  }
  return data.data;
}

export async function fetchTeamAiReviewHistory(teamId: number) {
  const { data } = await apiClient.get<ApiResponse<AiReviewResponse[]>>(`/v1/teams/${teamId}/ai-reviews`);
  return data.data ?? [];
}

const AI_FAILURE_REASONS: Record<string, string> = {
  AI_REVIEW_NOT_CONFIGURED: "Chưa cấu hình AI_API_KEY trên backend.",
  NO_REVIEWABLE_REPOSITORY: "Đội chưa có repository GitHub đã cấp.",
  NO_COMMITS_TO_REVIEW: "Repository chưa có commit mới để đánh giá."
};

export function formatAiReviewFailure(summary?: string | null, reason?: string | null) {
  if (reason && AI_FAILURE_REASONS[reason]) {
    return AI_FAILURE_REASONS[reason];
  }
  if (!summary) {
    return "Đánh giá AI thất bại — xem log backend để biết chi tiết.";
  }
  const lower = summary.toLowerCase();
  if (lower.includes("quota") || lower.includes("429") || lower.includes("resource exhausted")) {
    return "Hết quota API Gemini — thử lại sau hoặc đổi model.";
  }
  if (lower.includes("json") || lower.includes("parse") || lower.includes("invalid")) {
    return "Phản hồi LLM không hợp lệ — thử chạy lại hoặc giảm kích thước diff.";
  }
  if (lower.includes("timeout") || lower.includes("timed out")) {
    return "Gọi LLM quá thời gian — repo có thể quá lớn hoặc mạng chậm.";
  }
  if (summary.startsWith("AI review failed:")) {
    return summary.replace(/^AI review failed:\s*/i, "");
  }
  return summary;
}

export function parseJsonList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return raw ? [raw] : [];
  }
}

export function parseStructuredReview(raw: string | null | undefined): ParsedStructuredReview | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const criteria = parsed.criteria_comments as CriteriaComments | undefined;
    const smb = parsed.smb_scale_advisory as SmbScaleAdvisory | undefined;
    const overall = parsed.overall_picture as Record<string, unknown> | undefined;
    return {
      criteriaComments: criteria ?? null,
      smbScaleAdvisory: smb ?? null,
      historicalSynthesis: typeof overall?.historical_synthesis === "string" ? overall.historical_synthesis : null,
      evolutionNotes: typeof overall?.evolution_notes === "string" ? overall.evolution_notes : null
    };
  } catch {
    return null;
  }
}

export const CRITERIA_KEYS = [
  "R1_01",
  "R1_02",
  "R1_03",
  "R1_04",
  "R1_05",
  "R2_01",
  "R2_02",
  "R2_03",
  "R2_04",
  "R2_05"
] as const satisfies readonly (keyof CriteriaComments)[];

const RATING_PATTERN = /(Xuất sắc|Tốt|Khá|Trung bình|Yếu)/;

export function extractRubricRating(text: string | undefined | null) {
  if (!text) return { rating: null as string | null, comment: "" };
  const match = text.match(RATING_PATTERN);
  const rating = match?.[1] ?? null;
  const comment = rating ? text.replace(match![0], "").replace(/^[—\-\s:]+/, "").trim() : text.trim();
  return { rating, comment: comment || text.trim() };
}

export function rubricRatingTone(rating: string | null) {
  if (rating === "Xuất sắc" || rating === "Tốt") return "success" as const;
  if (rating === "Khá") return "active" as const;
  if (rating === "Trung bình") return "warning" as const;
  if (rating === "Yếu") return "danger" as const;
  return "neutral" as const;
}
