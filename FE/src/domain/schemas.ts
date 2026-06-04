import { z } from "zod";
import { uniqueNormalizedEmails } from "../utils/formValidation";

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

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Họ và tên cần ít nhất 2 ký tự."),
  email: z.string().trim().email("Email chưa đúng định dạng."),
  studentId: z.string().trim().optional(),
  university: z.string().trim().optional()
});

export const eventConfigSaveSchema = z
  .object({
    name: z.string().trim().min(3, "Tên cuộc thi cần ít nhất 3 ký tự."),
    quota: z.number().int().min(1, "Quota phải lớn hơn 0."),
    startDate: z.string().min(1, "Ngày bắt đầu là bắt buộc."),
    endDate: z.string().min(1, "Ngày kết thúc là bắt buộc."),
    registrationStartAt: z.string().min(1, "Thời gian mở đăng ký là bắt buộc."),
    registrationEndAt: z.string().min(1, "Thời gian đóng đăng ký là bắt buộc.")
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.",
    path: ["endDate"]
  })
  .refine(
    (data) =>
      new Date(data.registrationStartAt).getTime() <= new Date(data.registrationEndAt).getTime(),
    {
      message: "Thời gian đóng đăng ký phải sau thời gian mở đăng ký.",
      path: ["registrationEndAt"]
    }
  );

export const eventConfigSchema = eventConfigSaveSchema;

export const createEventSchema = z
  .object({
    name: z.string().trim().min(1, "Tên cuộc thi là bắt buộc."),
    startDate: z.string().min(1, "Ngày bắt đầu là bắt buộc."),
    endDate: z.string().min(1, "Ngày kết thúc là bắt buộc."),
    registrationStartAt: z.string().min(1, "Thời gian mở đăng ký là bắt buộc."),
    registrationEndAt: z.string().min(1, "Thời gian đóng đăng ký là bắt buộc."),
    maxTeams: z.number().int().min(1, "Quota đội phải lớn hơn 0.")
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.",
    path: ["endDate"]
  })
  .refine(
    (data) => new Date(data.registrationStartAt).getTime() <= new Date(data.registrationEndAt).getTime(),
    {
      message: "Thời gian đóng đăng ký phải sau thời gian mở đăng ký.",
      path: ["registrationEndAt"]
    }
  );

export const teamRegistrationSchema = z
  .object({
    teamName: z
      .string()
      .trim()
      .min(3, "Tên đội cần ít nhất 3 ký tự.")
      .max(100, "Tên đội tối đa 100 ký tự."),
    memberEmails: z
      .array(z.string().trim().email("Email thành viên chưa đúng định dạng."))
      .min(1, "Đội thi phải có từ 1 đến 5 thành viên.")
      .max(5, "Đội thi phải có từ 1 đến 5 thành viên.")
  })
  .refine((data) => uniqueNormalizedEmails(data.memberEmails).length === data.memberEmails.length, {
    message: "Trùng email thành viên trong form.",
    path: ["memberEmails"]
  });

export function teamRegistrationSchemaForEvent(minSize: number, maxSize: number) {
  return teamRegistrationSchema.refine(
    (data) => {
      const count = uniqueNormalizedEmails(data.memberEmails).length;
      return count >= minSize && count <= maxSize;
    },
    {
      message: `Đội thi phải có từ ${minSize} đến ${maxSize} thành viên (theo quy định cuộc thi).`,
      path: ["memberEmails"]
    }
  );
}

export const roundFormSchema = z
  .object({
    name: z.string().trim().min(1, "Tên vòng là bắt buộc."),
    roundOrder: z.number().int().positive("Thứ tự vòng phải ≥ 1."),
    startAt: z.string().min(1, "Thời gian bắt đầu là bắt buộc."),
    endAt: z.string().min(1, "Thời gian kết thúc là bắt buộc.")
  })
  .refine(
    (data) => {
      const start = new Date(data.startAt).getTime();
      const end = new Date(data.endAt).getTime();
      return !Number.isNaN(start) && !Number.isNaN(end) && start < end;
    },
    { message: "Thời gian kết thúc phải sau thời gian bắt đầu.", path: ["endAt"] }
  );

export const problemFormSchema = z
  .object({
    title: z.string().trim().min(1, "Tên đề thi là bắt buộc."),
    releaseAt: z.string().min(1, "Thời gian mở đề là bắt buộc."),
    closeAt: z.string().min(1, "Thời gian đóng đề là bắt buộc.")
  })
  .refine(
    (data) => new Date(data.closeAt).getTime() > new Date(data.releaseAt).getTime(),
    { message: "Thời gian đóng đề phải sau thời gian mở đề.", path: ["closeAt"] }
  );

export const boardFormSchema = z.object({
  name: z.string().trim().min(1, "Tên bảng là bắt buộc."),
  boardOrder: z.number().int().positive("Thứ tự bảng phải ≥ 1.")
});

export const slotNumberSchema = z.number().int().positive("Số vị trí slot phải ≥ 1.");

export const teamStatusRejectSchema = z.object({
  reason: z.string().trim().min(1, "Cần nhập lý do khi từ chối hoặc loại đội.")
});
