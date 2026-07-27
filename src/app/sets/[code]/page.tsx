import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicQuestionSetByCode } from "@/actions/publicSets";
import { PublicHeader } from "@/components/public/PublicHeader";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, HelpCircle, Calendar, Sparkles, BookOpen, AlertCircle } from "lucide-react";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function PublicSetDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { code } = resolvedParams;

  const res = await getPublicQuestionSetByCode(code);

  if (!res.success || !res.data) {
    notFound();
  }

  const set = res.data as typeof res.data & { subject?: string; semester?: string };
  const questionCount = set._count?.questions ?? 0;
  const hasQuestions = questionCount > 0;

  const formatDate = (dateInput: Date | string) => {
    return new Date(dateInput).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/80 flex flex-col justify-between selection:bg-indigo-500 selection:text-white font-sans">
      <div>
        <PublicHeader />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Thư viện mã đề</span>
          </Link>

          {/* Set Header Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-base font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-lg tracking-wider">
                  {set.code}
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                  Môn: {set.subject || "Chưa xếp"}
                </span>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${set.semester && set.semester !== "Chưa xếp" ? "bg-indigo-50 text-indigo-700 border border-indigo-100" : "bg-slate-100 text-slate-500"}`}>
                  {set.semester || "Chưa xếp"}
                </span>
              </div>

              {hasQuestions ? (
                <Badge variant="info" className="gap-1.5 py-1 px-3 text-xs">
                  <HelpCircle className="w-3.5 h-3.5" />
                  {questionCount} câu hỏi
                </Badge>
              ) : (
                <Badge variant="warning" className="gap-1.5 py-1 px-3 text-xs">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Chưa có câu hỏi
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {set.title}
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span suppressHydrationWarning>Cập nhật ngày {formatDate(set.updatedAt)}</span>
              </div>
            </div>

            {set.description && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                {set.description}
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              {hasQuestions ? (
                <Link href={`/sets/${set.code}/learn`} className="flex-1">
                  <button
                    type="button"
                    className="w-full py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm sm:text-base shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>Bắt đầu học Flashcard</span>
                  </button>
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex-1 py-3 px-5 rounded-2xl bg-slate-200 text-slate-400 font-bold text-sm sm:text-base cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  <span>Chưa có câu hỏi để học</span>
                </button>
              )}
            </div>
          </div>

          {/* Question List Preview */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Danh sách câu hỏi ({questionCount})
              </h2>
            </div>

            {hasQuestions ? (
              <div className="divide-y divide-slate-100">
                {set.questions.map((q, idx) => (
                  <div key={q.id} className="py-4 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex items-start gap-3">
                      <span className="font-mono font-bold text-indigo-600 text-xs bg-indigo-50 px-2 py-0.5 rounded-md mt-0.5">
                        #{idx + 1}
                      </span>
                      <p className="font-semibold text-slate-800 text-sm sm:text-base">
                        {q.question}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Mã đề này hiện chưa có câu hỏi
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Nội dung câu hỏi đang được cập nhật. Bạn vui lòng quay lại sau!
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <p>© 2026 Flashcard Learning Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
