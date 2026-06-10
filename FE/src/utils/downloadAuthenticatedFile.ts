import { apiClient } from "../services/apiClient";

function toApiPath(url: string) {
  if (url.startsWith("/api/")) {
    return url.slice(4);
  }
  if (url.startsWith("/v1/")) {
    return url;
  }
  return url;
}

export async function downloadAuthenticatedFile(url: string, fileName?: string) {
  const path = toApiPath(url);
  const response = await apiClient.get(path, { responseType: "blob" });
  const blob = response.data as Blob;
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName ?? "download";
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

export function isApiFileUrl(url: string) {
  return url.includes("/api/v1/files/") || url.includes("/v1/files/");
}
