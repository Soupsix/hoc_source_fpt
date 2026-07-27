import Link from "next/link";
import { getPublicQuestionSets } from "@/actions/publicSets";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicSearchForm } from "@/components/public/PublicSearchForm";
import { PublicSetCard } from "@/components/public/PublicSetCard";
import { Pagination } from "@/components/public/Pagination";
import { Sparkles, FolderOpen, SearchX, AlertTriangle, RotateCcw } from "lucide-react";

interface HomePageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || "";
  const pageParam = parseInt(resolvedParams.page || "1", 10);
  const page = isNaN(pageParam) ? 1 : pageParam;

  const result = await getPublicQuestionSets({
    query,
    page,
    limit: 12,
  });

  const { success, data: sets, total, page: currentPage, totalPages, error } = result;

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
              Khám phá các bộ mã đề học tập đã xuất bản, luyện tập ghi nhớ qua Flashcard hoặc kiểm tra trắc nghiệm tức thì.
            </p>

            {/* Search Form */}
            <div className="max-w-2xl mx-auto pt-2">
              <PublicSearchForm initialQuery={query} />
            </div>
          </div>

          {/* Results Summary Header */}
          {success && (
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
              <h2 className="text-sm font-semibold text-slate-700">
                {query ? (
                  <>Kết quả cho từ khóa <span className="text-indigo-600 font-bold">&quot;{query}&quot;</span> ({total} mã đề)</>
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
            query ? (
              /* No-result state */
              <div className="bg-white border border-slate-200/80 rounded-2xl p-8 sm:p-12 text-center max-w-md mx-auto my-8 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <SearchX className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Không tìm thấy mã đề phù hợp
                </h3>
                <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                  Không có mã đề xuất bản nào khớp với từ khóa &quot;{query}&quot;. Thử tìm kiếm theo mã đề hoặc tên chủ đề khác.
                </p>
                <div className="mt-5">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 text-slate-500" />
                    Xóa bộ lọc
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
            /* Cards Grid & Pagination */
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sets.map((set) => (
                  <PublicSetCard key={set.id} set={set} />
                ))}
              </div>

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
