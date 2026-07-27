"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/auth";
import { questionFormSchema, type QuestionFormValues, type ImportQuestionsInput } from "@/lib/validations/questions";
import { parseOptionsArray, formatOptionText } from "@/lib/utils";
import { Prisma } from "@prisma/client";

export async function createQuestionAction(setId: string, data: QuestionFormValues) {
  try {
    await verifyAdminSession();

    const validated = questionFormSchema.parse(data);

    // Get maximum current order for this set
    const maxOrderAgg = await prisma.question.aggregate({
      where: { setId },
      _max: { order: true },
    });
    const nextOrder = (maxOrderAgg._max.order ?? -1) + 1;

    const formattedOptions = validated.options
      ? parseOptionsArray(validated.options)
      : null;

    const newQuestion = await prisma.question.create({
      data: {
        setId,
        type: validated.type,
        question: validated.question,
        answer: validated.answer,
        options: formattedOptions && formattedOptions.length > 0 ? (formattedOptions as Prisma.InputJsonValue) : Prisma.JsonNull,
        explanation: validated.explanation || null,
        order: nextOrder,
      },
    });

    const set = await prisma.questionSet.findUnique({
      where: { id: setId },
      select: { code: true },
    });

    revalidatePath(`/admin/sets/${setId}`);
    if (set?.code) {
      revalidatePath(`/sets/${set.code}`);
      revalidatePath(`/sets/${set.code}/learn`);
      revalidatePath(`/sets/${set.code}/quiz`);
    }

    return { success: true, data: newQuestion };
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("UNAUTHORIZED")) {
      return { success: false, error: error.message };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Không thể tạo câu hỏi. Vui lòng thử lại." };
  }
}

export async function updateQuestionAction(questionId: string, data: QuestionFormValues) {
  try {
    await verifyAdminSession();

    const validated = questionFormSchema.parse(data);

    const formattedOptions = validated.options
      ? parseOptionsArray(validated.options)
      : null;

    const updated = await prisma.question.update({
      where: { id: questionId },
      data: {
        type: validated.type,
        question: validated.question,
        answer: validated.answer,
        options: formattedOptions && formattedOptions.length > 0 ? (formattedOptions as Prisma.InputJsonValue) : Prisma.JsonNull,
        explanation: validated.explanation || null,
      },
    });

    const set = await prisma.questionSet.findUnique({
      where: { id: updated.setId },
      select: { code: true },
    });

    revalidatePath(`/admin/sets/${updated.setId}`);
    if (set?.code) {
      revalidatePath(`/sets/${set.code}`);
      revalidatePath(`/sets/${set.code}/learn`);
      revalidatePath(`/sets/${set.code}/quiz`);
    }

    return { success: true, data: updated };
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("UNAUTHORIZED")) {
      return { success: false, error: error.message };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Không thể cập nhật câu hỏi. Vui lòng thử lại." };
  }
}

export async function deleteQuestionAction(questionId: string) {
  try {
    await verifyAdminSession();

    const deleted = await prisma.question.delete({
      where: { id: questionId },
    });

    const set = await prisma.questionSet.findUnique({
      where: { id: deleted.setId },
      select: { code: true },
    });

    revalidatePath(`/admin/sets/${deleted.setId}`);
    if (set?.code) {
      revalidatePath(`/sets/${set.code}`);
      revalidatePath(`/sets/${set.code}/learn`);
      revalidatePath(`/sets/${set.code}/quiz`);
    }

    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("UNAUTHORIZED")) {
      return { success: false, error: error.message };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Không thể xóa câu hỏi. Vui lòng thử lại." };
  }
}

export async function moveQuestionOrderAction(questionId: string, direction: "up" | "down") {
  try {
    await verifyAdminSession();

    const target = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!target) {
      return { success: false, error: "Không tìm thấy câu hỏi." };
    }

    const siblings = await prisma.question.findMany({
      where: { setId: target.setId },
      orderBy: { order: "asc" },
    });

    const index = siblings.findIndex((q) => q.id === questionId);
    if (index === -1) return { success: false, error: "Câu hỏi không hợp lệ." };

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= siblings.length) {
      return { success: true };
    }

    const swapTarget = siblings[targetIndex];

    await prisma.$transaction([
      prisma.question.update({
        where: { id: target.id },
        data: { order: swapTarget.order },
      }),
      prisma.question.update({
        where: { id: swapTarget.id },
        data: { order: target.order },
      }),
    ]);

    revalidatePath(`/admin/sets/${target.setId}`);
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("UNAUTHORIZED")) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Không thể thay đổi thứ tự câu hỏi." };
  }
}

export async function importQuestionsAction(setId: string, questionsData: ImportQuestionsInput) {
  try {
    await verifyAdminSession();

    if (!Array.isArray(questionsData) || questionsData.length === 0) {
      return { success: false, error: "Dữ liệu câu hỏi nhập vào không hợp lệ hoặc rỗng." };
    }

    const maxOrderAgg = await prisma.question.aggregate({
      where: { setId },
      _max: { order: true },
    });
    let startOrder = (maxOrderAgg._max.order ?? -1) + 1;

    const createInputs = questionsData.map((q) => {
      const order = startOrder++;
      const sanitizedOptions = q.options ? parseOptionsArray(q.options) : null;
      const formattedAnswer = formatOptionText(q.answer);

      return {
        setId,
        type: q.type || "FLASHCARD",
        question: formatOptionText(q.question).trim(),
        answer: formattedAnswer.trim(),
        options: sanitizedOptions && sanitizedOptions.length > 0 ? (sanitizedOptions as Prisma.InputJsonValue) : Prisma.JsonNull,
        explanation: q.explanation ? formatOptionText(q.explanation).trim() : null,
        order,
      };
    });

    await prisma.question.createMany({
      data: createInputs,
    });

    const set = await prisma.questionSet.findUnique({
      where: { id: setId },
      select: { code: true },
    });

    revalidatePath(`/admin/sets/${setId}`);
    if (set?.code) {
      revalidatePath(`/sets/${set.code}`);
      revalidatePath(`/sets/${set.code}/learn`);
      revalidatePath(`/sets/${set.code}/quiz`);
    }

    return { success: true, count: createInputs.length };
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("UNAUTHORIZED")) {
      return { success: false, error: error.message };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Không thể import danh sách câu hỏi." };
  }
}
