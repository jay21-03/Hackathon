import { parseLocalDateTimeValue } from "./dateTimeValidation";

/** `datetime-local` → ISO UTC cho API. Ném lỗi nếu giá trị không hợp lệ. */
export function toIsoFromLocal(value: string) {
  const parsed = parseLocalDateTimeValue(value);
  if (!parsed) {
    throw new Error("Thời gian không hợp lệ.");
  }
  return parsed.toISOString();
}

export function toLocalDateInput(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toLocalDateTimeInput(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
