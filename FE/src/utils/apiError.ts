import axios from "axios";

import { mapOrganizerErrorMessage } from "./organizerErrors";



function isGenericNetworkMessage(message: string) {

  const m = message.trim().toLowerCase();

  return m === "network error" || m === "networkerror" || m.startsWith("timeout");

}



type ApiErrorBody = {
  code?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
};

export function getApiFieldErrors(error: unknown): Record<string, string> | undefined {
  if (!axios.isAxiosError(error)) return undefined;
  const data = error.response?.data as ApiErrorBody | undefined;
  if (data?.fieldErrors && Object.keys(data.fieldErrors).length > 0) {
    return data.fieldErrors;
  }
  return undefined;
}

export function isUnauthorizedApiError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

/** Map @AssertTrue global keys (e.g. createEventRequest.registrationEndWithinEvent) → form field. */
const ASSERT_TRUE_FIELD_MAP: Record<string, string> = {
  eventDateRangeValid: "endDate",
  registrationWindowValid: "registrationEndAt",
  registrationEndWithinEvent: "registrationEndAt",
  registrationStartBeforeEvent: "registrationStartAt",
  dateRangeValid: "endDate",
  roundTimelineValid: "endAt",
  problemWindowValid: "closeAt",
  isExternalLinkValid: "externalLink"
};

/** Chuẩn hoá fieldErrors từ API sang tên field form + message tiếng Việt. */
export function normalizeApiFieldErrors(
  fieldErrors: Record<string, string>,
  fieldAliases?: Record<string, string>
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, message] of Object.entries(fieldErrors)) {
    const viMessage = mapOrganizerErrorMessage(message);
    const dotSuffix = key.includes(".") ? key.split(".").pop()! : key;
    const mapped =
      fieldAliases?.[key] ??
      fieldAliases?.[dotSuffix] ??
      ASSERT_TRUE_FIELD_MAP[dotSuffix] ??
      key;
    result[mapped] = viMessage;
  }
  return result;
}

/** Gán lỗi field từ API vào state form. Trả về true nếu có fieldErrors. */
export function applyApiFormErrors(
  error: unknown,
  setFieldErrors: (errors: Record<string, string>) => void,
  fieldAliases?: Record<string, string>
): boolean {
  const raw = getApiFieldErrors(error);
  if (!raw) return false;
  setFieldErrors(normalizeApiFieldErrors(raw, fieldAliases));
  return true;
}

export function getApiErrorCode(error: unknown): string | undefined {

  if (axios.isAxiosError(error)) {

    const data = error.response?.data as ApiErrorBody | undefined;

    if (data?.code?.trim()) return data.code.trim();

    if (data?.message?.trim()) return data.message.trim();

  }

  return undefined;

}



export function getApiErrorMessage(error: unknown, fallback = "Đã xảy ra lỗi. Vui lòng thử lại.") {

  if (axios.isAxiosError(error)) {

    const data = error.response?.data as ApiErrorBody | undefined;

    if (data?.message?.trim()) return data.message.trim();

    if (data?.code?.trim()) return data.code.trim();

    if (error.message && !isGenericNetworkMessage(error.message)) return error.message;

    if (error.code === "ERR_NETWORK" || !error.response) return fallback;

  }

  if (error instanceof Error && error.message && !isGenericNetworkMessage(error.message)) {

    return error.message;

  }

  return fallback;

}



/** Lỗi API đã map sang tiếng Việt cho người dùng cuối. */

export function resolveApiError(error: unknown, fallback = "Đã xảy ra lỗi. Vui lòng thử lại.") {

  return mapOrganizerErrorMessage(getApiErrorMessage(error, fallback));

}


