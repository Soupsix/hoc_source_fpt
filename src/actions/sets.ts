"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/auth";
import { questionSetSchema, type QuestionSetFormValues } from "@/lib/validations/sets";

export async function createQuestionSetAction(data: QuestionSetFormValues) {
  try {
    await verifyAdminSession();
    const validatedData = questionSetSchema.parse(data);

    // Check existing code
    const existing = await prisma.questionSet.findUnique({
      where: { code: validatedData.code },
    });

    if (existing) {
      return { success: false, error: "Mã đề này đã tồn tại." };
    }

    const newSet = await prisma.questionSet.create({
      data: {
        code: validatedData.code,
        title: validatedData.title,
        description: validatedData.description || null,
        subject: validatedData.subject,
        semester: validatedData.semester,
        isPublished: validatedData.isPublished ?? false,
      },
    });

    revalidatePath("/admin/sets");
    return { success: true, data: newSet };
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("UNAUTHORIZED")) {
      return { success: false, error: error.message };
    }
    // Prisma unique constraint error
    if (typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "P2002") {
      return { success: false, error: "Mã đề này đã tồn tại." };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Không thể tạo mã đề. Vui lòng thử lại." };
  }
}

export async function updateQuestionSetAction(id: string, data: QuestionSetFormValues) {
  try {
    await verifyAdminSession();
    const validatedData = questionSetSchema.parse(data);

    // Check code collision with another set
    const existingWithCode = await prisma.questionSet.findFirst({
      where: {
        code: validatedData.code,
        NOT: { id },
      },
    });

    if (existingWithCode) {
      return { success: false, error: "Mã đề này đã tồn tại." };
    }

    const updatedSet = await prisma.questionSet.update({
      where: { id },
      data: {
        code: validatedData.code,
        title: validatedData.title,
        description: validatedData.description || null,
        subject: validatedData.subject,
        semester: validatedData.semester,
        isPublished: validatedData.isPublished,
      },
    });

    revalidatePath("/admin/sets");
    revalidatePath(`/admin/sets/${id}`);
    return { success: true, data: updatedSet };
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("UNAUTHORIZED")) {
      return { success: false, error: error.message };
    }
    if (typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "P2002") {
      return { success: false, error: "Mã đề này đã tồn tại." };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Không thể cập nhật mã đề. Vui lòng thử lại." };
  }
}

export async function deleteQuestionSetAction(id: string) {
  try {
    await verifyAdminSession();

    await prisma.questionSet.delete({
      where: { id },
    });

    revalidatePath("/admin/sets");
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("UNAUTHORIZED")) {
      return { success: false, error: error.message };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Không thể xóa mã đề. Vui lòng thử lại." };
  }
}

export async function getQuestionSets(query?: string) {
  try {
    await verifyAdminSession();

    const search = query?.trim();

    const sets = await prisma.questionSet.findMany({
      where: search
        ? {
            OR: [
              { code: { contains: search, mode: "insensitive" } },
              { title: { contains: search, mode: "insensitive" } },
              { subject: { contains: search, mode: "insensitive" } },
              { semester: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

    return { success: true, data: sets };
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("UNAUTHORIZED")) {
      return { success: false, error: error.message, data: [] };
    }
    return { success: false, error: "Không thể lấy danh sách mã đề.", data: [] };
  }
}

export async function getQuestionSetById(id: string) {
  try {
    await verifyAdminSession();

    const set = await prisma.questionSet.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: { questions: true },
        },
      },
    });

    if (!set) {
      return { success: false, error: "Không tìm thấy mã đề.", data: null };
    }

    return { success: true, data: set };
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("UNAUTHORIZED")) {
      return { success: false, error: error.message, data: null };
    }
    return { success: false, error: "Không thể lấy chi tiết mã đề.", data: null };
  }
}
