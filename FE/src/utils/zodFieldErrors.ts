import type { ZodError } from "zod";

/** Map lỗi Zod theo path field (vd. `teamName`, `memberEmails`). */
export function zodFieldErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join(".") : "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
