import { repositoryUrlSchema } from "../domain/schemas";

export function isValidRepositoryUrl(value: string) {
  return repositoryUrlSchema.safeParse(value).success;
}

export function formatNumber(value: number | null) {
  return value === null ? "Chua co diem" : value.toFixed(1);
}
