import type { ApiResponse } from "../types/api";
import { apiClient } from "./apiClient";
import type { CriteriaRequestItem, RubricResponse } from "./scoringApi";

export interface CriteriaTemplateSummary {
  id: number;
  name: string;
  description?: string | null;
  systemDefault?: boolean;
  criteriaCount: number;
}

export interface CriteriaTemplateDetail extends CriteriaTemplateSummary {
  criteria: CriteriaRequestItem[];
}

export async function fetchCriteriaTemplates() {
  const { data } = await apiClient.get<ApiResponse<CriteriaTemplateSummary[]>>(
    "/v1/admin/criteria-templates"
  );
  return data.data ?? [];
}

export async function applyCriteriaTemplate(
  roundId: number,
  templateId: number,
  replaceExisting = true
) {
  const { data } = await apiClient.post<ApiResponse<RubricResponse>>(
    `/v1/admin/rounds/${roundId}/criteria/apply-template/${templateId}`,
    { replaceExisting }
  );
  if (!data.data) {
    throw new Error(data.message || "Áp dụng mẫu tiêu chí thất bại");
  }
  return data.data;
}

export async function copyRubricFromRound(
  targetRoundId: number,
  sourceRoundId: number,
  replaceExisting = true
) {
  const { data } = await apiClient.post<ApiResponse<RubricResponse>>(
    `/v1/admin/rounds/${targetRoundId}/criteria/copy-from-round/${sourceRoundId}`,
    { replaceExisting }
  );
  if (!data.data) {
    throw new Error(data.message || "Sao chép rubric thất bại");
  }
  return data.data;
}
