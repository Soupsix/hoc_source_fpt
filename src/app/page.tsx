import Link from "next/link";
import { getPublicQuestionSets, getPublicCategories, type PublicSetItem } from "@/actions/publicSets";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicSearchForm } from "@/components/public/PublicSearchForm";
import { PublicCategoryFilter } from "@/components/public/PublicCategoryFilter";
import { PublicSetCard } from "@/components/public/PublicSetCard";
import { Pagination } from "@/components/public/Pagination";
import { Sparkles, FolderOpen, SearchX, AlertTriangle, RotateCcw, GraduationCap } from "lucide-react";

interface HomePageProps {
  searchParams: Promise<{ q?: string; semester?: string; subject?: string; page?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || "";
  const semester = resolvedParams.semester || "";
  const subject = resolvedParams.subject || "";
  const pageParam = parseInt(resolvedParams.page || "1", 10);
  const page = isNaN(pageParam) ? 1 : pageParam;

  const [result, categories] = await Promise.all([
    getPublicQuestionSets({
      query,
      semester,
      subject,
      page,
      limit: 12,
    }),
    getPublicCategories(),
  ]);

  const { success, data: sets, total, page: currentPage, totalPages, error } = result;

  // Group sets by semester for categorized section display
  const semesterOrder = ["Kỳ 1", "Kỳ 2", "Kỳ 3", "Kỳ 4", "Kỳ 5", "Kỳ 6", "Kỳ 7", "Kỳ 8", "Kỳ 9", "Chưa xếp"];
  const groupedSetsMap = sets.reduce((acc, set) => {
    const semKey = set.semester || "Chưa xếp";
    if (!acc[semKey]) acc[semKey] = [];
    acc[semKey].push(set);
    return acc;
  }, {} as Record<string, PublicSetItem[]>);

  const sortedSemesterKeys = Object.keys(groupedSetsMap).sort((a, b) => {
    const idxA = semesterOrder.indexOf(a);
    const idxB = semesterOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  const hasActiveFilters = Boolean(query || semester || subject);

  return (
    <div className="min-h-screen bg-slate-50/80 flex flex-col justify-between selection:bg-indigo-500 selection:text-white font-sans">
      <div>
        <PublicHeader />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 border border-indigo-100 text-indigo-700">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Thư viện thẻ nhớ Flashcard
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Bạn muốn học gì hôm nay?
            </h1>
            <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Khám phá các bộ mã đề học tập đã xuất bản theo môn học và kỳ học, luyện tập ghi nhớ qua Flashcard hoặc thi trắc nghiệm.
            </p>

            {/* Search Form */}
            <div className="max-w-2xl mx-auto pt-2">
              <PublicSearchForm initialQuery={query} />
            </div>
          </div>

          {/* Category Filter Component */}
          {categories.semesters.length > 0 && (
            <div className="max-w-5xl mx-auto">
              <PublicCategoryFilter
                semesters={categories.semesters}
                subjects={categories.subjects}
                currentSemester={semester}
                currentSubject={subject}
              />
            </div>
          )}

          {/* Results Summary Header */}
          {success && (
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
              <h2 className="text-sm font-semibold text-slate-700">
                {hasActiveFilters ? (
                  <>
                    Kết quả lọc mã đề
                    {query && <> từ khóa <span className="text-indigo-600 font-bold">&quot;{query}&quot;</span></>}
                    {semester && <> • <span className="text-indigo-600 font-bold">{semester}</span></>}
                    {subject && <> • Môn <span className="text-indigo-600 font-bold">{subject}</span></>}
                    <span className="text-slate-500 ml-1">({total} mã đề)</span>
                  </>
                ) : (
                  <>Tất cả mã đề đã xuất bản ({total})</>
                )}
              </h2>
            </div>
          )}

          {/* UI States & Grid */}
          {!success || error ? (
            /* Error State */
            <div className="bg-white border border-red-200 rounded-2xl p-8 sm:p-12 text-center max-w-md mx-auto my-8 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Đã xảy ra lỗi</h3>
              <p className="mt-1 text-sm text-slate-500">{error || "Không thể tải dữ liệu."}</p>
              <div className="mt-5">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Thử lại
                </Link>
              </div>
            </div>
          ) : sets.length === 0 ? (
            hasActiveFilters ? (
              /* No-result state */
              <div className="bg-white border border-slate-200/80 rounded-2xl p-8 sm:p-12 text-center max-w-md mx-auto my-8 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <SearchX className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Không tìm thấy mã đề phù hợp
                </h3>
                <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                  Không có mã đề xuất bản nào khớp với bộ lọc đang chọn. Thử chọn kỳ học hoặc môn học khác.
                </p>
                <div className="mt-5">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 text-slate-500" />
                    Xóa tất cả bộ lọc
                  </Link>
                </div>
              </div>
            ) : (
              /* Empty state (no published sets at all in DB) */
              <div className="bg-white border border-slate-200/80 rounded-2xl p-8 sm:p-12 text-center max-w-md mx-auto my-8 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Hiện chưa có mã đề nào được xuất bản
                </h3>
                <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                  Quản trị viên đang biên soạn nội dung. Hãy quay lại sau để cập nhật danh sách bài học mới nhất.
                </p>
              </div>
            )
          ) : (
            /* Cards Categorized by Semester Sections & Pagination */
            <div className="space-y-10">
              {sortedSemesterKeys.map((semKey) => {
                const semSets = groupedSetsMap[semKey];
                return (
                  <section key={semKey} className="space-y-4">
                    <div className="flex items-center gap-2 border-l-4 border-indigo-600 pl-3 py-1">
                      <GraduationCap className="w-5 h-5 text-indigo-600" />
                      <h3 className="text-lg font-bold text-slate-900">
                        {semKey}
                      </h3>
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {semSets.length} mã đề
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {semSets.map((set) => (
                        <PublicSetCard key={set.id} set={set} />
                      ))}
                    </div>
                  </section>
                );
              })}

              <Pagination currentPage={currentPage} totalPages={totalPages} />
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 Flashcard Learning Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
