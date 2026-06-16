/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_ENABLE_ROLE_SWITCHER?: string;
  readonly VITE_ENABLE_PHASE_7?: string;
  readonly VITE_ENABLE_SCORING?: string;
  readonly VITE_ENABLE_SUBMISSIONS?: string;
  readonly VITE_ENABLE_GITHUB_PROVISIONING?: string;
  readonly VITE_ENABLE_AI_REVIEW?: string;
  readonly VITE_ENABLE_AWARDS?: string;
  readonly VITE_ENABLE_ACADEMIC_TERMS?: string;
  readonly VITE_ENABLE_RANKING?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
