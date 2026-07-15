import { z } from "zod";
import {
  doLocalDateTimeRangesOverlap,
  endOfLocalDate,
  isLocalDateRangeOrdered,
  isLocalDateTimeRangeOrdered,
  isLocalDateWithinInclusiveRange,
  localDateFieldSchema,
  localDateTimeFieldSchema,
  parseLocalDateTimeValue,
  startOfLocalDate
} from "../utils/dateTimeValidation";
import { uniqueNormalizedEmails } from "../utils/formValidation";

interface EventDateTimeShape {
  startDate: string;
  endDate: string;
  registrationStartAt: string;
  registrationEndAt: string;
}

function applyEventDateTimeRules<T extends z.ZodTypeAny>(schema: T) {
  return schema
    .refine(
      (data) => {
        const d = data as EventDateTimeShape;
        return isLocalDateRangeOrdered(d.startDate, d.endDate, true);
      },
      {
        message: "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.",
        path: ["endDate"]
      }
    )
    .refine(
      (data) => {
        const d = data as EventDateTimeShape;
        return isLocalDateTimeRangeOrdered(d.registrationStartAt, d.registrationEndAt, true);
      },
      {
        message: "Thời gian đóng đăng ký phải sau hoặc bằng thời gian mở đăng ký.",
        path: ["registrationEndAt"]
      }
    )
    .refine(
      (data) => {
        const d = data as EventDateTimeShape;
        const regEnd = parseLocalDateTimeValue(d.registrationEndAt);
        const eventEnd = endOfLocalDate(d.endDate);
        if (!regEnd || !eventEnd) return false;
        return regEnd.getTime() <= eventEnd.getTime();
      },
      {
        message: "Thời gian đóng đăng ký phải trước hoặc trong ngày kết thúc cuộc thi.",
        path: ["registrationEndAt"]
      }
    )
    .refine(
      (data) => {
        const d = data as EventDateTimeShape;
        const regStart = parseLocalDateTimeValue(d.registrationStartAt);
        const eventStart = startOfLocalDate(d.startDate);
        if (!regStart || !eventStart) return false;
        return regStart.getTime() <= eventStart.getTime();
      },
      {
        message: "Thời gian mở đăng ký nên trước hoặc bằng ngày bắt đầu cuộc thi.",
        path: ["registrationStartAt"]
      }
    );
}

function applyEventWithinTermRules<T extends z.ZodTypeAny>(
  schema: T,
  termStartDate?: string,
  termEndDate?: string
) {
  if (!termStartDate || !termEndDate) return schema;
  return schema
    .refine(
      (data) => {
        const d = data as EventDateTimeShape;
        return isLocalDateWithinInclusiveRange(d.startDate, termStartDate, termEndDate);
      },
      {
        message: "Ngày bắt đầu cuộc thi phải nằm trong khoảng học kỳ.",
        path: ["startDate"]
      }
    )
    .refine(
      (data) => {
        const d = data as EventDateTimeShape;
        return isLocalDateWithinInclusiveRange(d.endDate, termStartDate, termEndDate);
      },
      {
        message: "Ngày kết thúc cuộc thi phải nằm trong khoảng học kỳ.",
        path: ["endDate"]
      }
    );
}

/** Mirror BE AuthCredentialPolicy: ≥15 chars OR (≥8 + lowercase + digit). */
export const passwordPolicySchema = z
  .string()
  .min(1, "Mật khẩu là bắt buộc.")
  .refine(
    (value) =>
      value.length >= 15 ||
      (value.length >= 8 && /[a-z]/.test(value) && /\d/.test(value)),
    "Mật khẩu cần ≥15 ký tự, hoặc ≥8 ký tự gồm chữ thường và số."
  );

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email là bắt buộc.").email("Email chưa đúng định dạng."),
  password: z.string().min(1, "Mật khẩu là bắt buộc.")
});

const requiredGithubUsernameSchema = z
  .string()
  .trim()
  .min(1, "GitHub username là bắt buộc.")
  .refine((value) => {
    if (value.length < 3 || value.length > 39) return false;
    return /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(value);
  }, "GitHub username phải từ 3 đến 39 ký tự (chữ, số, dấu gạch ngang).");

export const studentTypeSchema = z.enum(["FPT", "EXTERNAL"], {
  message: "Chọn loại sinh viên."
});

const profileStudentFieldsSchema = z.object({
  studentType: studentTypeSchema,
  fullName: z
    .string()
    .trim()
    .min(2, "Họ và tên cần ít nhất 2 ký tự.")
    .max(200, "Họ tên tối đa 200 ký tự."),
  studentId: z
    .string()
    .trim()
    .min(1, "MSSV là bắt buộc.")
    .max(100, "MSSV tối đa 100 ký tự."),
  university: z.string().trim().max(200, "Tên trường tối đa 200 ký tự.").optional(),
  githubUsername: requiredGithubUsernameSchema
});

function applyStudentTypeRules<T extends z.ZodTypeAny>(schema: T) {
  return schema.superRefine((data, ctx) => {
    const value = data as { studentType?: string; university?: string };
    if (value.studentType === "EXTERNAL" && !value.university?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Trường là bắt buộc với sinh viên ngoài trường.",
        path: ["university"]
      });
    }
  });
}

export const profileCompletionSchema = applyStudentTypeRules(profileStudentFieldsSchema);

export const staffProfileFullNameSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Họ và tên cần ít nhất 2 ký tự.")
    .max(200, "Họ tên tối đa 200 ký tự.")
});

/** Mentor / giám khảo — họ tên + GitHub (cấp quyền xem repo đội). */
export const mentorJudgeProfileSchema = staffProfileFullNameSchema.extend({
  githubUsername: requiredGithubUsernameSchema
});

export const organizerProfileSchema = staffProfileFullNameSchema;

/** @deprecated Dùng mentorJudgeProfileSchema hoặc organizerProfileSchema. */
export const staffProfileCompletionSchema = mentorJudgeProfileSchema;

export const mentorJudgeSignupSchema = z
  .object({
    email: z.string().trim().min(1, "Email là bắt buộc.").email("Email chưa đúng định dạng."),
    password: passwordPolicySchema,
    confirmPassword: z.string().min(1, "Xác nhận mật khẩu là bắt buộc.")
  })
  .merge(mentorJudgeProfileSchema)
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"]
  });

/** @deprecated Dùng mentorJudgeSignupSchema. */
export const staffSignupSchema = mentorJudgeSignupSchema;

export const mentorJudgeProfileUpdateSchema = mentorJudgeProfileSchema;

/** @deprecated Dùng mentorJudgeProfileUpdateSchema hoặc organizerProfileSchema. */
export const staffProfileUpdateSchema = mentorJudgeProfileSchema;

export const signupSchema = z
  .object({
    email: z.string().trim().min(1, "Email là bắt buộc.").email("Email chưa đúng định dạng."),
    password: passwordPolicySchema,
    confirmPassword: z.string().min(1, "Xác nhận mật khẩu là bắt buộc.")
  })
  .merge(profileCompletionSchema)
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"]
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, "Email là bắt buộc.").email("Email chưa đúng định dạng.")
});

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, "Liên kết đặt lại mật khẩu không hợp lệ."),
    newPassword: passwordPolicySchema,
    confirmPassword: z.string().min(1, "Xác nhận mật khẩu là bắt buộc.")
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"]
  });

export interface ScoreCriterionBounds {
  id: number;
  name: string;
  minScore: number;
  maxScore: number;
}

/** Validate điểm đủ & trong khoảng trước khi nộp phiếu chấm. */
export function validateTeamScoresForSubmit(
  teamId: number,
  criteria: ScoreCriterionBounds[],
  cells: Record<string, string>
): string | null {
  for (const criterion of criteria) {
    const raw = cells[`${teamId}-${criterion.id}`];
    if (raw === "" || raw == null) {
      return `Thiếu điểm cho tiêu chí "${criterion.name}".`;
    }
    const score = Number(raw);
    if (Number.isNaN(score)) {
      return `Điểm tiêu chí "${criterion.name}" không hợp lệ.`;
    }
    if (score < criterion.minScore || score > criterion.maxScore) {
      return `Điểm "${criterion.name}" phải từ ${criterion.minScore} đến ${criterion.maxScore}.`;
    }
  }
  return null;
}

/** Cho phép ô trống khi lưu nháp; từ chối điểm ngoài khoảng. */
export function validateTeamScoresForDraft(
  teamId: number,
  criteria: ScoreCriterionBounds[],
  cells: Record<string, string>
): string | null {
  for (const criterion of criteria) {
    const raw = cells[`${teamId}-${criterion.id}`];
    if (raw === "" || raw == null) continue;
    const score = Number(raw);
    if (Number.isNaN(score)) {
      return `Điểm tiêu chí "${criterion.name}" không hợp lệ.`;
    }
    if (score < criterion.minScore || score > criterion.maxScore) {
      return `Điểm "${criterion.name}" phải từ ${criterion.minScore} đến ${criterion.maxScore}.`;
    }
  }
  return null;
}

export const repositoryUrlSchema = z
  .string()
  .trim()
  .url("Repository phải là đường dẫn hợp lệ.")
  .refine((value) => {
    const hostname = new URL(value).hostname.toLowerCase();
    return (
      hostname === "github.com" ||
      hostname.endsWith(".github.com") ||
      hostname === "gitlab.com" ||
      hostname.endsWith(".gitlab.com")
    );
  }, "Repository phải là link GitHub hoặc GitLab hợp lệ.");

export const submissionFormSchema = z.object({
  repositoryUrl: repositoryUrlSchema,
  repositoryName: z.string().trim().max(255, "Tên repository tối đa 255 ký tự.")
});

const githubUsernameSchema = z
  .string()
  .trim()
  .optional()
  .refine((value) => {
    if (!value) return true;
    if (value.length < 3 || value.length > 39) return false;
    return /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(value);
  }, "GitHub username phải từ 3 đến 39 ký tự (chữ, số, dấu gạch ngang).");

/** Hồ sơ chỉnh sửa — email read-only, không gửi lên API. */
export const profileUpdateSchema = applyStudentTypeRules(
  z.object({
    studentType: studentTypeSchema,
    fullName: z
      .string()
      .trim()
      .min(2, "Họ và tên cần ít nhất 2 ký tự.")
      .max(200, "Họ tên tối đa 200 ký tự."),
    studentId: z
      .string()
      .trim()
      .min(1, "MSSV là bắt buộc.")
      .max(100, "MSSV tối đa 100 ký tự."),
    university: z.string().trim().max(200, "Tên trường tối đa 200 ký tự.").optional(),
    githubUsername: githubUsernameSchema
  })
);

/** @deprecated Dùng profileUpdateSchema cho form lưu hồ sơ. */
export const profileSchema = profileUpdateSchema.extend({
  email: z.string().trim().email("Email chưa đúng định dạng.")
});

export const staffInviteSchema = z.object({
  email: z.string().trim().min(1, "Email là bắt buộc.").email("Email không hợp lệ."),
  boardId: z.number().int().positive("Chọn bảng trước khi gửi lời mời."),
  role: z.enum(["MENTOR", "JUDGE"], { message: "Chọn vai trò mentor hoặc giám khảo." })
});

export const bulkStaffEmailLineSchema = z.object({
  email: z.string().trim().email("Email không hợp lệ."),
  role: z.enum(["MENTOR", "JUDGE"]).optional()
});

export const bulkStaffEmailsSchema = z
  .array(bulkStaffEmailLineSchema)
  .min(1, "Nhập ít nhất một email hợp lệ.");

export const academicTermTypeSchema = z.enum(["SPRING", "SUMMER", "FALL"]);

export const academicTermFormSchema = z
  .object({
    year: z
      .number({ message: "Năm không hợp lệ." })
      .int("Năm phải là số nguyên.")
      .min(2000, "Năm phải từ 2000 trở lên.")
      .max(2100, "Năm không hợp lệ."),
    termType: academicTermTypeSchema,
    startDate: localDateFieldSchema,
    endDate: localDateFieldSchema
  })
  .refine((data) => isLocalDateRangeOrdered(data.startDate, data.endDate, false), {
    message: "Ngày kết thúc phải sau ngày bắt đầu.",
    path: ["endDate"]
  });

export const academicTermDateRangeSchema = z
  .object({
    startDate: localDateFieldSchema,
    endDate: localDateFieldSchema
  })
  .refine((data) => isLocalDateRangeOrdered(data.startDate, data.endDate, false), {
    message: "Ngày kết thúc phải sau ngày bắt đầu.",
    path: ["endDate"]
  });

export interface RubricCriteriaInput {
  code: string;
  name: string;
  weight: number;
  minScore: number;
  maxScore: number;
  levelDescriptors: Array<{
    level?: string;
    label: string;
    minScore: number;
    maxScore: number;
  }>;
}

const VALID_RUBRIC_LEVELS = new Set(["EXCELLENT", "GOOD", "SATISFACTORY", "UNSATISFACTORY"]);

/** Validate rubric trước khi lưu — mirror ScoringService.validateRubricRequest. */
export function validateRubricCriteria(criteria: RubricCriteriaInput[]): string | null {
  if (!criteria.length) {
    return "Cần ít nhất một tiêu chí chấm.";
  }
  const codes = new Set<string>();
  const names = new Set<string>();
  let weightSum = 0;
  for (let index = 0; index < criteria.length; index++) {
    const item = criteria[index];
    const label = `Tiêu chí ${index + 1}`;
    const code = item.code?.trim() ?? "";
    const name = item.name?.trim() ?? "";
    if (!code) return `${label}: mã tiêu chí là bắt buộc.`;
    if (!name) return `${label}: tên tiêu chí là bắt buộc.`;
    if (codes.has(code)) return `Mã tiêu chí "${code}" bị trùng.`;
    if (names.has(name)) return `Tên tiêu chí "${name}" bị trùng.`;
    codes.add(code);
    names.add(name);
    const weight = Number(item.weight);
    if (Number.isNaN(weight) || weight <= 0 || weight > 100) {
      return `${label}: trọng số phải lớn hơn 0 và tối đa 100.`;
    }
    weightSum += weight;
    if (!item.levelDescriptors || item.levelDescriptors.length !== 4) {
      return `${label}: cần đúng 4 mức mô tả.`;
    }
    for (const level of item.levelDescriptors) {
      const levelCode = level.level?.trim().toUpperCase() ?? "";
      if (!VALID_RUBRIC_LEVELS.has(levelCode)) {
        return `${label}: mức mô tả không hợp lệ (cần EXCELLENT, GOOD, SATISFACTORY hoặc UNSATISFACTORY).`;
      }
      if (!level.label?.trim()) {
        return `${label}: nhãn mức điểm không được trống.`;
      }
    }
    const minScore = Number(item.minScore);
    const maxScore = Number(item.maxScore);
    if (!Number.isNaN(minScore) && !Number.isNaN(maxScore) && minScore >= maxScore) {
      return `${label}: điểm tối thiểu phải nhỏ hơn điểm tối đa.`;
    }
  }
  if (weightSum !== 100) {
    return `Tổng trọng số phải bằng 100% (hiện tại ${weightSum}%).`;
  }
  return null;
}

export const eventDateTimeFields = z.object({
  startDate: localDateFieldSchema,
  endDate: localDateFieldSchema,
  registrationStartAt: localDateTimeFieldSchema,
  registrationEndAt: localDateTimeFieldSchema
});

const eventNameField = z
  .string()
  .trim()
  .min(3, "Tên cuộc thi cần ít nhất 3 ký tự.")
  .max(200, "Tên cuộc thi tối đa 200 ký tự.");

const eventDescriptionField = z
  .string()
  .trim()
  .max(10000, "Mô tả tối đa 10.000 ký tự.")
  .optional();

const eventRulesField = z
  .string()
  .trim()
  .max(20000, "Quy chế thi tối đa 20.000 ký tự.")
  .optional();

const eventConfigBaseSchema = z
  .object({
    name: eventNameField,
    description: eventDescriptionField,
    rules: eventRulesField,
    quota: z.number().int().min(1, "Quota phải lớn hơn 0.")
  })
  .merge(eventDateTimeFields);

const createEventBaseSchema = z
  .object({
    name: eventNameField,
    description: eventDescriptionField,
    rules: eventRulesField,
    maxTeams: z.number().int().min(1, "Quota đội phải lớn hơn 0."),
    academicTermId: z.number().int().positive("Học kỳ là bắt buộc.")
  })
  .merge(eventDateTimeFields);

export function eventConfigSaveSchemaForTerm(termStartDate?: string, termEndDate?: string) {
  return applyEventWithinTermRules(
    applyEventDateTimeRules(eventConfigBaseSchema),
    termStartDate,
    termEndDate
  );
}

export function createEventSchemaForTerm(termStartDate?: string, termEndDate?: string) {
  return applyEventWithinTermRules(
    applyEventDateTimeRules(createEventBaseSchema),
    termStartDate,
    termEndDate
  );
}

export const eventConfigSaveSchema = eventConfigSaveSchemaForTerm();
export const eventConfigSchema = eventConfigSaveSchema;
export const createEventSchema = createEventSchemaForTerm();

const memberProfileSchema = z.object({
  email: z.string().trim().email("Email thành viên chưa đúng định dạng."),
  studentId: z
    .string()
    .trim()
    .min(1, "MSSV là bắt buộc.")
    .max(100, "MSSV tối đa 100 ký tự."),
  university: z
    .string()
    .trim()
    .min(1, "Trường là bắt buộc.")
    .max(200, "Tên trường tối đa 200 ký tự.")
});

export function teamRegistrationSchemaForEvent(minSize: number, maxSize: number) {
  const sizeMessage = `Đội thi phải có từ ${minSize} đến ${maxSize} thành viên (theo quy định cuộc thi).`;
  return z
    .object({
      teamName: z
        .string()
        .trim()
        .min(3, "Tên đội cần ít nhất 3 ký tự.")
        .max(100, "Tên đội tối đa 100 ký tự."),
      members: z.array(memberProfileSchema).min(minSize, sizeMessage).max(maxSize, sizeMessage)
    })
    .refine(
      (data) =>
        uniqueNormalizedEmails(data.members.map((member) => member.email)).length ===
        data.members.length,
      {
        message: "Trùng email thành viên trong form.",
        path: ["members"]
      }
    );
}

/** @deprecated Dùng teamRegistrationSchemaForEvent(min, max) */
export const teamRegistrationSchema = teamRegistrationSchemaForEvent(1, 5);

const roundFormBaseSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Tên vòng là bắt buộc.")
      .max(200, "Tên vòng tối đa 200 ký tự."),
    roundOrder: z.number().int().positive("Thứ tự vòng phải ≥ 1."),
    startAt: localDateTimeFieldSchema,
    endAt: localDateTimeFieldSchema
  })
  .refine((data) => isLocalDateTimeRangeOrdered(data.startAt, data.endAt, false), {
    message: "Thời gian kết thúc phải sau thời gian bắt đầu.",
    path: ["endAt"]
  });

export const roundFormSchema = roundFormBaseSchema;

export type RoundFormValues = z.infer<typeof roundFormBaseSchema>;

export interface RoundTimelineBounds {
  id?: number;
  startAt: string;
  endAt: string;
}

/** Vòng thi phải nằm trong khoảng ngày cuộc thi và không chồng vòng khác. */
export function roundFormSchemaForEvent(
  eventStartDate?: string,
  eventEndDate?: string,
  existingRounds: RoundTimelineBounds[] = [],
  excludeRoundId?: number
): z.ZodType<RoundFormValues> {
  let schema: z.ZodType<RoundFormValues>;
  if (!eventStartDate || !eventEndDate) {
    schema = roundFormBaseSchema;
  } else {
  schema = roundFormBaseSchema
    .refine(
      (data) => {
        const start = parseLocalDateTimeValue(data.startAt);
        const eventStart = startOfLocalDate(eventStartDate);
        if (!start || !eventStart) return false;
        return start.getTime() >= eventStart.getTime();
      },
      {
        message: "Thời gian bắt đầu vòng phải từ ngày bắt đầu cuộc thi.",
        path: ["startAt"]
      }
    )
    .refine(
      (data) => {
        const end = parseLocalDateTimeValue(data.endAt);
        const eventEnd = endOfLocalDate(eventEndDate);
        if (!end || !eventEnd) return false;
        return end.getTime() <= eventEnd.getTime();
      },
      {
        message: "Thời gian kết thúc vòng phải trước hoặc trong ngày kết thúc cuộc thi.",
        path: ["endAt"]
      }
    );
  }

  const peers = existingRounds.filter((round) => round.id !== excludeRoundId);
  if (!peers.length) return schema;

  return schema.refine(
    (data) =>
      !peers.some((peer) =>
        doLocalDateTimeRangesOverlap(data.startAt, data.endAt, peer.startAt, peer.endAt)
      ),
    {
      message: "Thời gian vòng chồng lấn với vòng khác trong cùng cuộc thi.",
      path: ["startAt"]
    }
  );
}

const optionalUrlField = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || /^https?:\/\/.+/i.test(value), {
    message: "URL phải bắt đầu bằng http:// hoặc https://."
  });

const problemFormBaseSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Tên đề thi là bắt buộc.")
      .max(255, "Tên đề thi tối đa 255 ký tự."),
    description: z
      .string()
      .trim()
      .max(10000, "Mô tả đề thi tối đa 10.000 ký tự.")
      .optional(),
    releaseAt: localDateTimeFieldSchema,
    closeAt: localDateTimeFieldSchema,
    externalLink: optionalUrlField
  })
  .refine((data) => isLocalDateTimeRangeOrdered(data.releaseAt, data.closeAt, false), {
    message: "Thời gian đóng đề phải sau thời gian mở đề.",
    path: ["closeAt"]
  });

export const problemFormSchema = problemFormBaseSchema;

/** Cửa sổ mở/đóng đề phải nằm trong thời gian vòng thi. */
export function problemFormSchemaForRound(roundStartAt?: string, roundEndAt?: string) {
  if (!roundStartAt || !roundEndAt) return problemFormBaseSchema;
  return problemFormBaseSchema
    .refine(
      (data) => {
        const release = parseLocalDateTimeValue(data.releaseAt);
        const roundStart = parseLocalDateTimeValue(roundStartAt);
        if (!release || !roundStart) return false;
        return release.getTime() >= roundStart.getTime();
      },
      {
        message: "Thời gian mở đề phải từ thời gian bắt đầu vòng.",
        path: ["releaseAt"]
      }
    )
    .refine(
      (data) => {
        const close = parseLocalDateTimeValue(data.closeAt);
        const roundEnd = parseLocalDateTimeValue(roundEndAt);
        if (!close || !roundEnd) return false;
        return close.getTime() <= roundEnd.getTime();
      },
      {
        message: "Thời gian đóng đề phải trước hoặc bằng thời gian kết thúc vòng.",
        path: ["closeAt"]
      }
    );
}

export const boardFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Tên bảng là bắt buộc.")
    .max(200, "Tên bảng tối đa 200 ký tự."),
  boardOrder: z.number().int().positive("Thứ tự bảng phải ≥ 1."),
  description: z.string().trim().max(500, "Mô tả bảng tối đa 500 ký tự.").optional()
});

export const slotNumberSchema = z.number().int().positive("Số vị trí phải ≥ 1.");

export const teamStatusRejectSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "Cần nhập lý do khi từ chối hoặc loại đội.")
    .max(1000, "Lý do tối đa 1.000 ký tự.")
});

export const announcementSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Tiêu đề là bắt buộc.")
    .max(255, "Tiêu đề tối đa 255 ký tự."),
  content: z
    .string()
    .trim()
    .min(1, "Nội dung là bắt buộc.")
    .max(10000, "Nội dung tối đa 10.000 ký tự."),
  audience: z.enum(["ALL", "PARTICIPANTS", "STAFF"]),
  publishNow: z.boolean()
});

const githubRepoSlugSchema = z
  .string()
  .trim()
  .min(1, "Tên repository là bắt buộc.")
  .regex(
    /^[a-zA-Z0-9](?:[a-zA-Z0-9._-]*[a-zA-Z0-9])?$/,
    "Tên repository không hợp lệ."
  );

export const repoTemplateSchema = z.object({
  templateOwner: z
    .string()
    .trim()
    .min(1, "GitHub owner là bắt buộc.")
    .refine(
      (value) => /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(value),
      "GitHub owner không hợp lệ."
    ),
  templateRepo: githubRepoSlugSchema,
  defaultBranch: z.string().trim().min(1, "Nhánh mặc định là bắt buộc.").max(100),
  enabled: z.boolean()
});

export const PROBLEM_ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;
export const PROBLEM_ATTACHMENT_EXTENSIONS = ["pdf", "docx", "zip"] as const;

export function validateProblemAttachmentFile(file: File): string | null {
  if (file.size > PROBLEM_ATTACHMENT_MAX_BYTES) {
    return "Tệp vượt quá 20MB.";
  }
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !PROBLEM_ATTACHMENT_EXTENSIONS.includes(ext as (typeof PROBLEM_ATTACHMENT_EXTENSIONS)[number])) {
    return "Chỉ chấp nhận PDF, DOCX hoặc ZIP.";
  }
  return null;
}

export const teamMemberInviteSchema = z.object({
  email: z.string().trim().min(1, "Email là bắt buộc.").email("Email không hợp lệ.")
});

export const assignRoleSchema = z.object({
  role: z.enum(["ORGANIZER", "MENTOR", "JUDGE"], {
    message: "Vai trò không hợp lệ."
  })
});

export const advancementExecuteSchema = z
  .object({
    fromRoundId: z.number().int().positive(),
    toRoundId: z.number().int().positive(),
    topNPerBoard: z.number().int().min(1, "Top N phải ≥ 1."),
    /** Rỗng = dùng top N / bảng (khớp BE). */
    teamIds: z.array(z.number().int().positive())
  })
  .refine((data) => data.fromRoundId !== data.toRoundId, {
    message: "Vòng nguồn và vòng đích phải khác nhau.",
    path: ["toRoundId"]
  });

export const randomAssignSchema = z.object({
  boardIds: z.array(z.number().int().positive()).optional(),
  slotIds: z.array(z.number().int().positive()).optional(),
  chunkSize: z.number().int().min(1, "Kích thước lô phải ≥ 1.").optional(),
  seed: z.union([z.number().int(), z.string().trim().max(100)]).optional()
});

const awardCodeSchema = z
  .string()
  .trim()
  .min(1, "Mã loại giải là bắt buộc.")
  .max(100, "Mã tối đa 100 ký tự.")
  .regex(/^[A-Za-z0-9][A-Za-z0-9_\- ]*$/, "Mã chỉ chứa chữ, số, gạch dưới, gạch ngang và khoảng trắng.");

export const awardCategorySchema = z.object({
  name: z.string().trim().min(1, "Tên loại giải là bắt buộc.").max(255, "Tên tối đa 255 ký tự."),
  code: awardCodeSchema,
  description: z.string().trim().max(2000, "Mô tả tối đa 2.000 ký tự.").optional(),
  awardType: z.enum(["RANK", "CUSTOM"], { message: "Loại giải không hợp lệ." }),
  rankOrder: z.number().int().positive().optional(),
  maxWinners: z.number().int().min(1, "Số giải tối đa phải ≥ 1.").default(1),
  prizeValue: z.string().trim().max(255, "Giá trị giải tối đa 255 ký tự.").optional(),
  sortOrder: z.number().int().optional(),
  roundId: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().optional()
});

export const assignTeamAwardSchema = z.object({
  awardCategoryId: z.number().int().positive("Chọn loại giải."),
  teamId: z.number().int().positive("Chọn đội."),
  roundId: z.number().int().positive().optional()
});

export const staffCarryoverSchema = z.object({
  sourceTermId: z.number().int().positive().optional(),
  defaultRole: z.enum(["MENTOR", "JUDGE"]),
  items: z
    .array(
      z.object({
        userId: z.number().int().positive(),
        role: z.enum(["MENTOR", "JUDGE"])
      })
    )
    .min(1, "Chọn ít nhất một giám khảo hoặc mentor.")
    .max(100, "Tối đa 100 người mỗi lần chuyển.")
});
