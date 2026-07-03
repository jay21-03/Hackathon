import type { ApiResponse } from "../types/api";
import { getAccessToken } from "../auth/tokenStorage";
import { apiClient } from "./apiClient";

export type AiReviewStatus = "PENDING" | "LLM_STARTED" | "COMPLETED" | "FAILED";
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
  /** Machine handover alias returned by BE. */
  handoverStatus?: string | null;
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
  techStack?: TechStackGroup | null;
  inventoryExhaustive?: InventoryExhaustive | null;
  ragLevel?: string | null;
  ragFeatures?: string[];
  assessment?: Record<string, string> | null;
  agentIntelligence?: AgentIntelligence | null;
}

export interface TechStackGroup {
  frameworks?: string[];
  llm_models?: string[];
  vector_db?: string[];
  agent_frameworks?: string[];
  third_party_tools?: string[];
}

export interface InventoryExhaustive {
  languages?: string[];
  frameworks_libraries?: string[];
  data_stores?: string[];
  ai_ml_stack?: string[];
  devops_infra?: string[];
}

export interface AgentIntelligence {
  reasoning_pattern?: string | null;
  detected_skills?: string[];
  tool_definitions?: string[];
  has_agent_config_files?: boolean;
}

export interface ParsedPerPushReview {
  techStack?: TechStackGroup | null;
  inventoryExhaustive?: InventoryExhaustive | null;
  agentIntelligence?: AgentIntelligence | null;
  ragLevel?: string | null;
  ragFeatures?: string[];
  assessment?: Record<string, string> | null;
  suggestedTestCases?: string[];
  suggestedQuestions?: string[];
  suggestedPromptRefinement?: string[];
  projectAbout?: string | null;
  pushSummary?: string | null;
  significantChange?: boolean;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function asStringMap(value: unknown): Record<string, string> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw === "string" && raw.trim()) out[key] = raw.trim();
  }
  return Object.keys(out).length > 0 ? out : null;
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

export async function triggerTeamAiReview(teamId: number, eventId?: number | null) {
  const { data } = await apiClient.post<ApiResponse<AiReviewResponse>>(
    eventId != null
      ? `/v1/admin/events/${eventId}/teams/${teamId}/ai-reviews/run`
      : `/v1/admin/teams/${teamId}/ai-reviews/run`,
    undefined,
    { timeout: 180_000 }
  );
  if (!data.data) {
    throw new Error(data.message || "Không chạy được đánh giá AI.");
  }
  return data.data;
}

export interface BackfillCommitsRequest {
  since: string;
  until?: string | null;
  runReview?: boolean | null;
}

export interface BackfillCommitsResponse {
  teamId: number;
  commitsImported: number;
  commitsSkipped: number;
  commitsFetched: number;
  since: string;
  until: string;
  reviewTriggered: boolean;
}

export async function backfillTeamCommits(teamId: number, body: BackfillCommitsRequest, eventId?: number | null) {
  const { data } = await apiClient.post<ApiResponse<BackfillCommitsResponse>>(
    eventId != null
      ? `/v1/admin/events/${eventId}/teams/${teamId}/ai-reviews/backfill`
      : `/v1/admin/teams/${teamId}/ai-reviews/backfill`,
    body
  );
  if (!data.data) {
    throw new Error(data.message || "Không backfill được commit.");
  }
  return data.data;
}

export interface AiReviewHealthResponse {
  eventId: number;
  aiConfigured: boolean;
  schedulerEnabled: boolean;
  webhookReviewEnabled: boolean;
  teamsWithRepository: number;
  teamsWithCompletedReview: number;
  teamsWithFailedReview: number;
  teamsPendingReview: number;
  totalFailedReviews: number;
  oldestFailedReviewAt?: string | null;
  recommendation?: string | null;
}

export async function fetchAiReviewHealth(eventId: number) {
  const { data } = await apiClient.get<ApiResponse<AiReviewHealthResponse>>(
    `/v1/admin/events/${eventId}/ai-reviews/health`
  );
  if (!data.data) {
    throw new Error(data.message || "Không tải sức khỏe AI review.");
  }
  return data.data;
}

export interface RetryFailedReviewsResponse {
  teamsAttempted: number;
  teamsSucceeded: number;
  teamsFailed: number;
  failures: BulkAiReviewFailure[];
}

export async function retryFailedEventAiReviews(eventId: number) {
  const { data } = await apiClient.post<ApiResponse<RetryFailedReviewsResponse>>(
    `/v1/admin/events/${eventId}/ai-reviews/retry-failed`
  );
  if (!data.data) {
    throw new Error(data.message || "Không thử lại review lỗi.");
  }
  return data.data;
}

export async function downloadAiReviewsCsv(eventId: number) {
  const base = apiClient.defaults.baseURL ?? "/api";
  const token = getAccessToken();
  const response = await fetch(`${base}/v1/admin/events/${eventId}/ai-reviews/export`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!response.ok) {
    throw new Error("Không xuất được CSV.");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `ai-reviews-event-${eventId}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
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
  AI_REVIEW_NOT_CONFIGURED: "Dịch vụ đánh giá AI chưa được bật. Liên hệ ban tổ chức.",
  NO_REVIEWABLE_REPOSITORY: "Đội chưa được cấp mã nguồn.",
  NO_COMMITS_TO_REVIEW: "Chưa có thay đổi mới trên mã nguồn để đánh giá."
};

export function formatAiReviewFailure(summary?: string | null, reason?: string | null) {
  if (reason && AI_FAILURE_REASONS[reason]) {
    return AI_FAILURE_REASONS[reason];
  }
  if (!summary) {
    return "Đánh giá AI thất bại — thử lại sau hoặc liên hệ ban tổ chức.";
  }
  const lower = summary.toLowerCase();
  if (lower.includes("quota") || lower.includes("429") || lower.includes("resource exhausted")) {
    return "Hệ thống đánh giá AI đang quá tải — thử lại sau.";
  }
  if (lower.includes("503") || lower.includes("service unavailable") || lower.includes("high demand")) {
    return "Gemini đang quá tải tạm thời — vui lòng thử lại sau vài phút.";
  }
  if (lower.includes("json") || lower.includes("parse") || lower.includes("invalid") || lower.includes("validation failed")) {
    return "Kết quả đánh giá không hợp lệ — thử chạy lại.";
  }
  if (lower.includes("timeout") || lower.includes("timed out")) {
    return "Đánh giá AI quá thời gian — mã nguồn có thể quá lớn, thử lại sau.";
  }
  if (summary.startsWith("AI review failed:")) {
    return summary.replace(/^AI review failed:\s*/i, "");
  }
  return summary;
}

export function formatHandoverStatus(status?: AiReviewStatus | null, handoverStatus?: string | null) {
  if (handoverStatus) return handoverStatus;
  if (status === "COMPLETED") return "done";
  if (status === "FAILED") return "error";
  if (status === "LLM_STARTED" || status === "PENDING") return "llm_started";
  return status ?? "llm_started";
}

export function handoverStatusLabel(handoverStatus: string) {
  if (handoverStatus === "done") return "Hoàn tất";
  if (handoverStatus === "error") return "Lỗi";
  if (handoverStatus === "llm_started") return "Đang đánh giá bằng AI";
  return handoverStatus;
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
    const criteria = normalizeCriteriaComments(parsed.criteria_comments);
    const smb = normalizeSmbAdvisory(parsed.smb_scale_advisory);
    const overall = parsed.overall_picture as Record<string, unknown> | undefined;
    const rag = parsed.rag_maturity as Record<string, unknown> | undefined;
    const agent = parsed.agent_intelligence as AgentIntelligence | undefined;
    return {
      criteriaComments: criteria ?? null,
      smbScaleAdvisory: smb ?? null,
      historicalSynthesis: typeof overall?.historical_synthesis === "string" ? overall.historical_synthesis : null,
      evolutionNotes: typeof overall?.evolution_notes === "string" ? overall.evolution_notes : null,
      techStack: (parsed.tech_stack as TechStackGroup | undefined) ?? null,
      inventoryExhaustive: (parsed.inventory_exhaustive as InventoryExhaustive | undefined) ?? null,
      ragLevel: typeof rag?.level === "string" ? rag.level : null,
      ragFeatures: asStringArray(rag?.features_detected),
      assessment: asStringMap(parsed.assessment),
      agentIntelligence: agent ?? null
    };
  } catch {
    return null;
  }
}

export function parsePerPushStructured(raw: string | null | undefined): ParsedPerPushReview | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const techStack = parsed.tech_stack as TechStackGroup | undefined;
    const inventory = parsed.inventory_exhaustive as InventoryExhaustive | undefined;
    const agent = parsed.agent_intelligence as AgentIntelligence | undefined;
    const rag = parsed.rag_maturity as Record<string, unknown> | undefined;
    const overall = parsed.overall_picture as Record<string, unknown> | undefined;
    return {
      techStack: techStack ?? null,
      inventoryExhaustive: inventory ?? null,
      agentIntelligence: agent ?? null,
      ragLevel: typeof rag?.level === "string" ? rag.level : null,
      ragFeatures: asStringArray(rag?.features_detected),
      assessment: asStringMap(parsed.assessment),
      suggestedTestCases: asStringArray(parsed.suggested_test_cases),
      suggestedQuestions: asStringArray(parsed.suggested_questions_for_team),
      suggestedPromptRefinement: asStringArray(parsed.suggested_prompt_refinement),
      projectAbout: typeof overall?.project_about === "string" ? overall.project_about : null,
      pushSummary: typeof overall?.push_summary === "string" ? overall.push_summary : null,
      significantChange: overall?.significant_change === true
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

/** Legacy / Vercel example keys → canonical R1_01…R2_05 */
const CRITERIA_ALIASES: Record<string, keyof CriteriaComments> = {
  r1_problem_solution: "R1_01",
  r1_tech_stack_suitability: "R1_02",
  r1_data_pipeline: "R1_02",
  r1_retrieval_citation: "R1_03",
  r1_intent_prompting: "R1_04",
  r1_completeness_readiness: "R1_05",
  r1_presentation_doc: "R1_05",
  r2_agent_multihop: "R2_01",
  r2_model_resources: "R2_02",
  r2_production_ops: "R2_03",
  r2_observability_monitoring: "R2_03",
  r2_extensibility: "R2_04",
  r2_bgk_qa: "R2_05",
  r2_security_best_practices: "R2_05"
};

const SMB_ALIASES: Record<string, keyof SmbScaleAdvisory> = {
  architecture_recommendations: "tech_and_architecture",
  infrastructure_cost_estimation: "cost_for_smb",
  security_compliance: "summary",
  operations_maintenance: "observability_and_operations",
  scalability_strategy: "throughput_and_reliability",
  technology_stack_evolution: "data_and_integrations",
  system_identity: "system_identity_recap",
  tech_arch: "tech_and_architecture",
  cost: "cost_for_smb",
  reliability: "throughput_and_reliability",
  observability: "observability_and_operations",
  data: "data_and_integrations"
};

function normalizeCriteriaComments(raw: unknown): CriteriaComments | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out: CriteriaComments = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value !== "string" || !value.trim()) continue;
    const upper = key.toUpperCase().replace(/-/g, "_");
    if ((CRITERIA_KEYS as readonly string[]).includes(upper)) {
      out[upper as keyof CriteriaComments] = value;
      continue;
    }
    const alias = CRITERIA_ALIASES[key] ?? CRITERIA_ALIASES[key.toLowerCase()];
    if (alias) out[alias] = value;
  }
  return Object.keys(out).length > 0 ? out : null;
}

function normalizeSmbAdvisory(raw: unknown): SmbScaleAdvisory | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out: SmbScaleAdvisory = {};
  const canonical: (keyof SmbScaleAdvisory)[] = [
    "system_identity_recap",
    "summary",
    "tech_and_architecture",
    "cost_for_smb",
    "throughput_and_reliability",
    "observability_and_operations",
    "data_and_integrations"
  ];
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value !== "string" || !value.trim()) continue;
    if (canonical.includes(key as keyof SmbScaleAdvisory)) {
      out[key as keyof SmbScaleAdvisory] = value;
      continue;
    }
    const alias = SMB_ALIASES[key] ?? SMB_ALIASES[key.toLowerCase()];
    if (alias) out[alias] = value;
  }
  return Object.keys(out).length > 0 ? out : null;
}

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
