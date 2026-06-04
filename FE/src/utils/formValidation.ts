import type { ZodError } from "zod";

export function zodErrorMessages(error: ZodError): string[] {
  return error.issues.map((issue) => issue.message);
}

export function zodFirstError(error: ZodError): string {
  return error.issues[0]?.message ?? "Dữ liệu chưa hợp lệ.";
}

export function parseLocalDateTime(value: string): Date | null {
  if (!value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isDateRangeValid(start: string, end: string): boolean {
  const startDate = parseLocalDateTime(start);
  const endDate = parseLocalDateTime(end);
  if (!startDate || !endDate) return false;
  return startDate.getTime() < endDate.getTime();
}

export function isLocalDateRangeValid(start: string, end: string): boolean {
  if (!start || !end) return false;
  return start <= end;
}

export function uniqueNormalizedEmails(emails: string[]): string[] {
  return Array.from(
    new Set(
      emails
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}
