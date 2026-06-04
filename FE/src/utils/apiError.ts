import axios from "axios";

function isGenericNetworkMessage(message: string) {
  const m = message.trim().toLowerCase();
  return m === "network error" || m === "networkerror" || m.startsWith("timeout");
}

export function getApiErrorMessage(error: unknown, fallback = "Đã xảy ra lỗi. Vui lòng thử lại.") {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message?.trim()) return data.message;
    if (error.message && !isGenericNetworkMessage(error.message)) return error.message;
    if (error.code === "ERR_NETWORK" || !error.response) return fallback;
  }
  if (error instanceof Error && error.message && !isGenericNetworkMessage(error.message)) {
    return error.message;
  }
  return fallback;
}
