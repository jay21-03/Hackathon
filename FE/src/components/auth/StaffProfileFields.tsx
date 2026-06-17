import { AuthFieldLabel, authInputClassName } from "./AuthFormShell";

interface StaffProfileFieldsProps {
  fullName: string;
  onFullNameChange: (value: string) => void;
  githubUsername?: string;
  onGithubUsernameChange?: (value: string) => void;
  requireGithub?: boolean;
  githubHint?: string;
  fieldErrors: Record<string, string>;
  onClearError: (key: string) => void;
  disabled?: boolean;
}

export function StaffProfileFields({
  fullName,
  onFullNameChange,
  githubUsername = "",
  onGithubUsernameChange,
  requireGithub = false,
  githubHint = "Cần để BTC cấp quyền xem repository GitHub của đội khi chấm điểm hoặc hỗ trợ.",
  fieldErrors,
  onClearError,
  disabled = false
}: StaffProfileFieldsProps) {
  return (
    <>
      <AuthFieldLabel label="Họ và tên" required>
        <input
          className={authInputClassName(fieldErrors.fullName ? "border-error" : "")}
          value={fullName}
          onChange={(e) => {
            onFullNameChange(e.target.value);
            onClearError("fullName");
          }}
          placeholder="Nguyễn Văn A"
          autoComplete="name"
          disabled={disabled}
        />
        {fieldErrors.fullName ? (
          <span className="font-body-sm text-error">{fieldErrors.fullName}</span>
        ) : null}
      </AuthFieldLabel>

      {requireGithub ? (
        <AuthFieldLabel label="GitHub username" required>
          <input
            className={authInputClassName(fieldErrors.githubUsername ? "border-error" : "")}
            value={githubUsername}
            onChange={(e) => {
              onGithubUsernameChange?.(e.target.value);
              onClearError("githubUsername");
            }}
            placeholder="ten-tai-khoan-github"
            autoComplete="username"
            disabled={disabled}
          />
          {fieldErrors.githubUsername ? (
            <span className="font-body-sm text-error">{fieldErrors.githubUsername}</span>
          ) : null}
          <span className="font-body-sm text-on-surface-variant">{githubHint}</span>
        </AuthFieldLabel>
      ) : null}
    </>
  );
}
