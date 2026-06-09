import axios from "axios";

import { mapOrganizerErrorMessage } from "./organizerErrors";



function isGenericNetworkMessage(message: string) {

  const m = message.trim().toLowerCase();

  return m === "network error" || m === "networkerror" || m.startsWith("timeout");

}



export function getApiErrorCode(error: unknown): string | undefined {

  if (axios.isAxiosError(error)) {

    const data = error.response?.data as { code?: string; message?: string } | undefined;

    if (data?.code?.trim()) return data.code.trim();

    if (data?.message?.trim()) return data.message.trim();

  }

  return undefined;

}



export function getApiErrorMessage(error: unknown, fallback = "Đã xảy ra lỗi. Vui lòng thử lại.") {

  if (axios.isAxiosError(error)) {

    const data = error.response?.data as { code?: string; message?: string } | undefined;

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


