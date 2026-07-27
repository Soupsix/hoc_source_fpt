import { z } from "zod";

export const questionTypeEnum = z.enum(["FLASHCARD", "SINGLE_CHOICE", "MULTIPLE_CHOICE"]);

export const questionFormSchema = z.object({
  type: questionTypeEnum.default("FLASHCARD"),
  question: z
    .string()
    .min(1, { message: "Nội dung câu hỏi không được để trống." })
    .transform((val) => val.trim()),
  answer: z
    .string()
    .min(1, { message: "Đáp án không được để trống." })
    .transform((val) => val.trim()),
  options: z
    .array(z.string().transform((val) => val.trim()))
    .optional()
    .nullable(),
  explanation: z
    .string()
    .transform((val) => (val ? val.trim() : ""))
    .optional()
    .nullable(),
  order: z.number().int().default(0),
});

export type QuestionFormValues = z.infer<typeof questionFormSchema>;

export const importQuestionsSchema = z.array(
  z.object({
    type: questionTypeEnum.optional().default("FLASHCARD"),
    question: z.string().min(1),
    answer: z.string().min(1),
    options: z.array(z.string()).optional(),
    explanation: z.string().optional(),
  })
);

export type ImportQuestionsInput = z.infer<typeof importQuestionsSchema>;
