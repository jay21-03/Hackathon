/** Cấu hình mẫu repo GitHub — khớp Hackathon/.env (GITHUB_TEMPLATE_*). */
export const GITHUB_REPO_TEMPLATE_DEFAULTS = {
  templateOwner: import.meta.env.VITE_GITHUB_TEMPLATE_OWNER || "lamthanhphuc",
  templateRepo: import.meta.env.VITE_GITHUB_TEMPLATE_REPO || "seal-hackathon-template",
  defaultBranch: import.meta.env.VITE_GITHUB_DEFAULT_BRANCH || "main",
  enabled: true
} as const;
