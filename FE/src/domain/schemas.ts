import { z } from "zod";

export const repositoryUrlSchema = z
  .string()
  .trim()
  .url("Repository phải là đường dẫn hợp lệ.")
  .refine((value) => {
    const hostname = new URL(value).hostname.toLowerCase();
    return hostname === "github.com" || hostname.endsWith(".github.com") || hostname === "gitlab.com" || hostname.endsWith(".gitlab.com");
  }, "Repository phải là link GitHub hoặc GitLab hợp lệ.");

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Họ và tên cần ít nhất 2 ký tự."),
  email: z.string().trim().email("Email chưa đúng định dạng."),
  studentId: z.string().trim().optional(),
  university: z.string().trim().optional()
});

export const eventConfigSchema = z
  .object({
    name: z.string().trim().min(3, "Tên cuộc thi cần ít nhất 3 ký tự."),
    quota: z.number().int().min(1, "Quota phải lớn hơn 0."),
    minTeamSize: z.number().int().min(1, "Đội thi cần ít nhất 1 thành viên."),
    maxTeamSize: z.number().int().max(5, "Đội thi tối đa 5 thành viên.")
  })
  .refine((value) => value.minTeamSize <= value.maxTeamSize, {
    message: "Số thành viên tối thiểu không được lớn hơn tối đa.",
    path: ["maxTeamSize"]
  });

export const teamRegistrationSchema = z.object({
  teamName: z.string().trim().min(2, "Tên đội là bắt buộc."),
  memberEmails: z
    .array(z.string().trim().email("Email thành viên chưa đúng định dạng."))
    .min(1, "Đội thi phải có từ 1 đến 5 thành viên.")
    .max(5, "Đội thi phải có từ 1 đến 5 thành viên.")
});
