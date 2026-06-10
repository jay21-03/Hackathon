import { z } from "zod";

/** `input[type=date]` — YYYY-MM-DD */
export const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** `input[type=datetime-local]` — YYYY-MM-DDTHH:mm */
export const LOCAL_DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export function parseLocalDateValue(value: string): Date | null {
  const trimmed = value.trim();
  if (!LOCAL_DATE_PATTERN.test(trimmed)) return null;
  const date = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const [year, month, day] = trimmed.split("-").map(Number);
  if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
    return null;
  }
  return date;
}

export function parseLocalDateTimeValue(value: string): Date | null {
  const trimmed = value.trim();
  if (!LOCAL_DATETIME_PATTERN.test(trimmed)) return null;
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isValidLocalDateValue(value: string): boolean {
  return parseLocalDateValue(value) != null;
}

export function isValidLocalDateTimeValue(value: string): boolean {
  return parseLocalDateTimeValue(value) != null;
}

/** Cuối ngày local (23:59:59.999) cho so sánh với datetime-local. */
export function endOfLocalDate(value: string): Date | null {
  const date = parseLocalDateValue(value);
  if (!date) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function startOfLocalDate(value: string): Date | null {
  return parseLocalDateValue(value);
}

export const localDateFieldSchema = z
  .string()
  .trim()
  .min(1, "Ngày là bắt buộc.")
  .refine(isValidLocalDateValue, "Ngày không hợp lệ (định dạng YYYY-MM-DD).");

export const localDateTimeFieldSchema = z
  .string()
  .trim()
  .min(1, "Thời gian là bắt buộc.")
  .refine(isValidLocalDateTimeValue, "Thời gian không hợp lệ (định dạng ngày + giờ).");

export function assertValidLocalDateTimeForApi(value: string, label = "Thời gian"): string {
  const parsed = parseLocalDateTimeValue(value);
  if (!parsed) {
    throw new Error(`${label} không hợp lệ.`);
  }
  return parsed.toISOString();
}

export function assertValidLocalDateForApi(value: string, label = "Ngày"): string {
  const parsed = parseLocalDateValue(value);
  if (!parsed) {
    throw new Error(`${label} không hợp lệ.`);
  }
  return value.trim();
}

/** So sánh khoảng ngày local (YYYY-MM-DD). */
export function isLocalDateRangeOrdered(start: string, end: string, allowEqual = false): boolean {
  const startDate = parseLocalDateValue(start);
  const endDate = parseLocalDateValue(end);
  if (!startDate || !endDate) return false;
  return allowEqual
    ? startDate.getTime() <= endDate.getTime()
    : startDate.getTime() < endDate.getTime();
}

/** So sánh khoảng datetime-local. */
export function isLocalDateTimeRangeOrdered(start: string, end: string, allowEqual = false): boolean {
  const startAt = parseLocalDateTimeValue(start);
  const endAt = parseLocalDateTimeValue(end);
  if (!startAt || !endAt) return false;
  return allowEqual
    ? startAt.getTime() <= endAt.getTime()
    : startAt.getTime() < endAt.getTime();
}

/** Parse datetime-local hoặc ISO từ API. */
export function parseContestDateTimeValue(value: string): Date | null {
  const local = parseLocalDateTimeValue(value);
  if (local) return local;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const iso = new Date(trimmed);
  return Number.isNaN(iso.getTime()) ? null : iso;
}

export function isLocalDateWithinInclusiveRange(
  date: string,
  rangeStart: string,
  rangeEnd: string
): boolean {
  const value = parseLocalDateValue(date);
  const start = parseLocalDateValue(rangeStart);
  const end = parseLocalDateValue(rangeEnd);
  if (!value || !start || !end) return false;
  return value.getTime() >= start.getTime() && value.getTime() <= end.getTime();
}

/** Hai khoảng thời gian chồng nhau (cho phép tiếp giáp: endA === startB). */
export function doLocalDateTimeRangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const aStart = parseContestDateTimeValue(startA);
  const aEnd = parseContestDateTimeValue(endA);
  const bStart = parseContestDateTimeValue(startB);
  const bEnd = parseContestDateTimeValue(endB);
  if (!aStart || !aEnd || !bStart || !bEnd) return false;
  return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime();
}
