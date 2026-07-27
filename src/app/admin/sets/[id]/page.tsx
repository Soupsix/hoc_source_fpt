import Link from "next/link";
import { notFound } from "next/navigation";
import { getQuestionSetById } from "@/actions/sets";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SetDetailActions } from "@/components/admin/SetDetailActions";
import { AdminQuestionsList, QuestionListItem } from "@/components/admin/AdminQuestionsList";
import { formatOptionText } from "@/lib/utils";
import { ArrowLeft, Calendar, HelpCircle, Layers } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SetDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const res = await getQuestionSetById(id);

  if (!res.success || !res.data) {
    notFound();
  }

  const set = res.data;
  const questionsCount = set._count?.questions ?? 0;

  const formatDate = (dateInput: Date | string) => {
    return new Date(dateInput).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formattedQuestions: QuestionListItem[] = (set.questions || []).map((q) => ({
    id: q.id,
    type: (q.type || "FLASHCARD") as "FLASHCARD" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE",
    question: formatOptionText(q.question),
    answer: formatOptionText(q.answer),
    options: q.options,
    explanation: q.explanation ? formatOptionText(q.explanation) : null,
    order: q.order,
  }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/sets"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-200/60 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="sr-only">Quay lại</span>
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xl font-bold text-indigo-600">
                {set.code}
              </span>
              {set.isPublished ? (
                <Badge variant="success">Đã xuất bản</Badge>
              ) : (
                <Badge variant="neutral">Bản nháp</Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
              {set.title}
            </h1>
          </div>
        </div>

        <SetDetailActions setId={set.id} setCode={set.code} />
      </div>

      {/* Details Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Tổng số câu hỏi</p>
              <p className="text-lg font-bold text-slate-900">{questionsCount} câu</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Ngày tạo</p>
              <p className="text-sm font-semibold text-slate-900">{formatDate(set.createdAt)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Ngày cập nhật</p>
              <p className="text-sm font-semibold text-slate-900">{formatDate(set.updatedAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description Card */}
      {set.description && (
        <Card>
          <CardHeader>
            <CardTitle>Mô tả bộ câu hỏi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">
              {set.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Interactive Admin Questions Management */}
      <AdminQuestionsList setId={set.id} questions={formattedQuestions} />
    </div>
  );
}
