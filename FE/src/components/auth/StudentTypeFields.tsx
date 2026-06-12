import { AuthFieldLabel, authInputClassName } from "./AuthFormShell";

export type StudentTypeValue = "FPT" | "EXTERNAL";

interface StudentTypeFieldsProps {
  studentType: StudentTypeValue;
  onStudentTypeChange: (value: StudentTypeValue) => void;
  fullName: string;
  onFullNameChange: (value: string) => void;
  studentId: string;
  onStudentIdChange: (value: string) => void;
  university: string;
  onUniversityChange: (value: string) => void;
  githubUsername: string;
  onGithubUsernameChange: (value: string) => void;
  fieldErrors: Record<string, string>;
  onClearError: (key: string) => void;
  disabled?: boolean;
}

export function StudentTypeFields({
  studentType,
  onStudentTypeChange,
  fullName,
  onFullNameChange,
  studentId,
  onStudentIdChange,
  university,
  onUniversityChange,
  githubUsername,
  onGithubUsernameChange,
  fieldErrors,
  onClearError,
  disabled = false
}: StudentTypeFieldsProps) {
  return (
    <>
      <AuthFieldLabel label="Loại sinh viên" required>
        <div className="flex flex-wrap gap-md">
          <label className="flex cursor-pointer items-center gap-xs font-body-md text-on-surface">
            <input
              type="radio"
              name="studentType"
              value="FPT"
              checked={studentType === "FPT"}
              disabled={disabled}
              onChange={() => {
                onStudentTypeChange("FPT");
                onClearError("studentType");
              }}
            />
            Sinh viên FPT
          </label>
          <label className="flex cursor-pointer items-center gap-xs font-body-md text-on-surface">
            <input
              type="radio"
              name="studentType"
              value="EXTERNAL"
              checked={studentType === "EXTERNAL"}
              disabled={disabled}
              onChange={() => {
                onStudentTypeChange("EXTERNAL");
                onClearError("studentType");
              }}
            />
            Sinh viên ngoài trường
          </label>
        </div>
        {fieldErrors.studentType ? (
          <span className="font-body-sm text-error">{fieldErrors.studentType}</span>
        ) : null}
      </AuthFieldLabel>

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

      <div className="grid gap-md sm:grid-cols-2">
        <AuthFieldLabel label="MSSV" required>
          <input
            className={authInputClassName(fieldErrors.studentId ? "border-error" : "")}
            value={studentId}
            onChange={(e) => {
              onStudentIdChange(e.target.value);
              onClearError("studentId");
            }}
            placeholder={studentType === "FPT" ? "SE123456" : "Mã số sinh viên"}
            disabled={disabled}
          />
          {fieldErrors.studentId ? (
            <span className="font-body-sm text-error">{fieldErrors.studentId}</span>
          ) : null}
        </AuthFieldLabel>

        {studentType === "EXTERNAL" ? (
          <AuthFieldLabel label="Trường" required>
            <input
              className={authInputClassName(fieldErrors.university ? "border-error" : "")}
              value={university}
              onChange={(e) => {
                onUniversityChange(e.target.value);
                onClearError("university");
              }}
              placeholder="Đại học ..."
              disabled={disabled}
            />
            {fieldErrors.university ? (
              <span className="font-body-sm text-error">{fieldErrors.university}</span>
            ) : null}
          </AuthFieldLabel>
        ) : (
          <AuthFieldLabel label="Trường" hint="Mặc định FPT University nếu để trống.">
            <input
              className={authInputClassName(fieldErrors.university ? "border-error" : "")}
              value={university}
              onChange={(e) => {
                onUniversityChange(e.target.value);
                onClearError("university");
              }}
              placeholder="FPT University"
              disabled={disabled}
            />
          </AuthFieldLabel>
        )}
      </div>

      <AuthFieldLabel label="GitHub username" required>
        <input
          className={authInputClassName(fieldErrors.githubUsername ? "border-error" : "")}
          value={githubUsername}
          onChange={(e) => {
            onGithubUsernameChange(e.target.value);
            onClearError("githubUsername");
          }}
          placeholder="ten-tai-khoan-github"
          autoComplete="username"
          disabled={disabled}
        />
        {fieldErrors.githubUsername ? (
          <span className="font-body-sm text-error">{fieldErrors.githubUsername}</span>
        ) : null}
      </AuthFieldLabel>
    </>
  );
}
