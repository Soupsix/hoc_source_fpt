"use server";

import { prisma } from "@/lib/prisma";

export interface PublicSetItem {
  id: string;
  code: string;
  title: string;
  description: string | null;
  updatedAt: Date | string;
  isPublished: boolean;
  _count: {
    questions: number;
  };
}

export interface GetPublicSetsParams {
  query?: string;
  page?: number;
  limit?: number;
}

export interface GetPublicSetsResult {
  success: boolean;
  data: PublicSetItem[];
  total: number;
  page: number;
  totalPages: number;
  error?: string;
}

export async function getPublicQuestionSets({
  query = "",
  page = 1,
  limit = 12,
}: GetPublicSetsParams): Promise<GetPublicSetsResult> {
  try {
    const search = query.trim();
    const currentPage = Math.max(1, isNaN(page) ? 1 : Math.floor(page));
    const take = Math.max(1, limit);

    const whereCondition = {
      isPublished: true,
      ...(search
        ? {
            OR: [
              { code: { contains: search, mode: "insensitive" as const } },
              { title: { contains: search, mode: "insensitive" as const } },
              { description: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const total = await prisma.questionSet.count({
      where: whereCondition,
    });

    const totalPages = Math.max(1, Math.ceil(total / take));
    const safePage = Math.min(currentPage, totalPages);
    const skip = (safePage - 1) * take;

    const sets = await prisma.questionSet.findMany({
      where: whereCondition,
      select: {
        id: true,
        code: true,
        title: true,
        description: true,
        updatedAt: true,
        isPublished: true,
        _count: {
          select: {
            questions: true,
          },
        },
      },
      orderBy: [
        { updatedAt: "desc" },
        { title: "asc" },
      ],
      skip: total > 0 ? skip : 0,
      take,
    });

    return {
      success: true,
      data: sets as PublicSetItem[],
      total,
      page: safePage,
      totalPages,
    };
  } catch (error: unknown) {
    console.error("Lỗi khi truy vấn danh sách mã đề công khai:", error);
    return {
      success: false,
      data: [],
      total: 0,
      page: 1,
      totalPages: 1,
      error: "Không thể lấy danh sách mã đề. Vui lòng thử lại sau.",
    };
  }
}

export async function getPublicQuestionSetByCode(code: string) {
  try {
    const formattedCode = code.trim().toUpperCase();

    const set = await prisma.questionSet.findFirst({
      where: {
        code: formattedCode,
        isPublished: true,
      },
      include: {
        questions: {
          orderBy: {
            order: "asc",
          },
        },
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });

    if (!set) {
      return { success: false, error: "Không tìm thấy mã đề công khai.", data: null };
    }

    return { success: true, data: set };
  } catch (error: unknown) {
    console.error("Lỗi khi truy vấn mã đề theo code:", error);
    return { success: false, error: "Không thể tải mã đề.", data: null };
  }
}
