import { repositoryUrlSchema } from "../domain/schemas";

export function isValidRepositoryUrl(value: string) {
  return repositoryUrlSchema.safeParse(value).success;
}

export function formatNumber(value: number | null) {
  return value === null ? "Chưa có điểm" : value.toFixed(1);
}
