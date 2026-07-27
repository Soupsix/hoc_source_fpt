"use server";

import { prisma } from "@/lib/prisma";

export interface PublicSetItem {
  id: string;
  code: string;
  title: string;
  description: string | null;
  subject: string;
  semester: string;
  updatedAt: Date | string;
  isPublished: boolean;
  _count: {
    questions: number;
  };
}

export interface GetPublicSetsParams {
  query?: string;
  subject?: string;
  semester?: string;
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
  subject = "",
  semester = "",
  page = 1,
  limit = 12,
}: GetPublicSetsParams): Promise<GetPublicSetsResult> {
  try {
    const search = query.trim();
    const subjectFilter = subject.trim();
    const semesterFilter = semester.trim();
    const currentPage = Math.max(1, isNaN(page) ? 1 : Math.floor(page));
    const take = Math.max(1, limit);

    const whereCondition = {
      isPublished: true,
      ...(subjectFilter ? { subject: subjectFilter } : {}),
      ...(semesterFilter ? { semester: semesterFilter } : {}),
      ...(search
        ? {
            OR: [
              { code: { contains: search, mode: "insensitive" as const } },
              { title: { contains: search, mode: "insensitive" as const } },
              { description: { contains: search, mode: "insensitive" as const } },
              { subject: { contains: search, mode: "insensitive" as const } },
              { semester: { contains: search, mode: "insensitive" as const } },
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
        subject: true,
        semester: true,
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

export interface CategoryFilterData {
  semesters: string[];
  subjects: string[];
}

export async function getPublicCategories(): Promise<CategoryFilterData> {
  try {
    const sets = await prisma.questionSet.findMany({
      where: { isPublished: true },
      select: { semester: true, subject: true },
    });

    const semestersSet = new Set<string>();
    const subjectsSet = new Set<string>();

    sets.forEach((s) => {
      if (s.semester) semestersSet.add(s.semester);
      if (s.subject) subjectsSet.add(s.subject);
    });

    const semesterOrder = ["Kỳ 1", "Kỳ 2", "Kỳ 3", "Kỳ 4", "Kỳ 5", "Kỳ 6", "Kỳ 7", "Kỳ 8", "Kỳ 9", "Chưa xếp"];
    const semesters = Array.from(semestersSet).sort((a, b) => {
      const idxA = semesterOrder.indexOf(a);
      const idxB = semesterOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    const subjects = Array.from(subjectsSet).sort((a, b) => {
      if (a === "Chưa xếp") return 1;
      if (b === "Chưa xếp") return -1;
      return a.localeCompare(b);
    });

    return { semesters, subjects };
  } catch (error) {
    console.error("Lỗi khi lấy danh mục phân loại:", error);
    return { semesters: [], subjects: [] };
  }
}
