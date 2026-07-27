import { z } from "zod";

export const questionSetSchema = z.object({
  code: z
    .string()
    .min(1, { message: "Mã đề không được để trống." })
    .min(3, { message: "Mã đề phải dài từ 3 đến 30 ký tự." })
    .max(30, { message: "Mã đề phải dài từ 3 đến 30 ký tự." })
    .regex(/^[A-Z0-9_-]+$/, {
      message: "Mã đề chỉ được chứa chữ cái, chữ số, dấu gạch ngang (-) và gạch dưới (_).",
    }),
  title: z
    .string()
    .min(1, { message: "Tên đề không được để trống." })
    .max(150, { message: "Tên đề không được vượt quá 150 ký tự." }),
  description: z
    .string()
    .max(1000, { message: "Mô tả không được vượt quá 1000 ký tự." })
    .optional()
    .nullable(),
  isPublished: z.boolean(),
});

export type QuestionSetFormValues = z.infer<typeof questionSetSchema>;

export const adminLoginSchema = z.object({
  accessCode: z.string().min(1, { message: "Vui lòng nhập mã truy cập Admin." }),
});

export type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;
