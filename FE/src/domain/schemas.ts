import { z } from "zod";

export const repositoryUrlSchema = z
  .string()
  .trim()
  .url("Repository phai la duong dan hop le.")
  .refine((value) => {
    const hostname = new URL(value).hostname.toLowerCase();
    return hostname === "github.com" || hostname.endsWith(".github.com") || hostname === "gitlab.com" || hostname.endsWith(".gitlab.com");
  }, "Repository phai la link GitHub hoac GitLab hop le.");

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Ho va ten can it nhat 2 ky tu."),
  email: z.string().trim().email("Email chua dung dinh dang."),
  studentId: z.string().trim().optional(),
  university: z.string().trim().optional()
});

export const eventConfigSchema = z
  .object({
    name: z.string().trim().min(3, "Ten cuoc thi can it nhat 3 ky tu."),
    quota: z.number().int().min(1, "Quota phai lon hon 0."),
    minTeamSize: z.number().int().min(1, "Doi thi can it nhat 1 thanh vien."),
    maxTeamSize: z.number().int().max(5, "Doi thi toi da 5 thanh vien.")
  })
  .refine((value) => value.minTeamSize <= value.maxTeamSize, {
    message: "So thanh vien toi thieu khong duoc lon hon toi da.",
    path: ["maxTeamSize"]
  });

export const teamRegistrationSchema = z.object({
  teamName: z.string().trim().min(2, "Ten doi la bat buoc."),
  memberEmails: z
    .array(z.string().trim().email("Email thanh vien chua dung dinh dang."))
    .min(1, "Doi thi phai co tu 1 den 5 thanh vien.")
    .max(5, "Doi thi phai co tu 1 den 5 thanh vien.")
});
