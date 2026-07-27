import Link from "next/link";
import { PublicSetItem } from "@/actions/publicSets";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Play, Eye, Calendar, AlertCircle, Award } from "lucide-react";

interface PublicSetCardProps {
  set: PublicSetItem;
}

export function PublicSetCard({ set }: PublicSetCardProps) {
  const questionCount = set._count?.questions ?? 0;
  const hasQuestions = questionCount > 0;

  const formatDate = (dateInput: Date | string) => {
    const d = new Date(dateInput);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden group">
      {/* Top Header Card Info */}
      <div className="p-5 sm:p-6 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="font-mono text-sm font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md tracking-wider">
            {set.code}
          </span>

          {!hasQuestions ? (
            <Badge variant="warning" className="gap-1 text-xs py-0.5">
              <AlertCircle className="w-3 h-3" />
              Chưa có câu hỏi
            </Badge>
          ) : (
            <Badge variant="info" className="gap-1 text-xs py-0.5">
              <HelpCircle className="w-3 h-3" />
              {questionCount} câu hỏi
            </Badge>
          )}
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
            <Link href={`/sets/${set.code}`}>
              {set.title}
            </Link>
          </h3>

          <p className="mt-1.5 text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
            {set.description || "Chưa có mô tả chi tiết cho bộ câu hỏi này."}
          </p>
        </div>
      </div>

      {/* Card Footer Actions & Date */}
      <div className="px-5 sm:px-6 py-4 bg-slate-50/60 border-t border-slate-100 flex flex-col gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Cập nhật: {formatDate(set.updatedAt)}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <Link href={`/sets/${set.code}`} className="w-full">
            <button
              type="button"
              className="w-full py-2 px-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <Eye className="w-4 h-4 text-slate-500" />
              <span>Xem mã đề</span>
            </button>
          </Link>

          {hasQuestions ? (
            <div className="flex gap-1.5 w-full">
              <Link href={`/sets/${set.code}/learn`} className="flex-1">
                <button
                  type="button"
                  title="Học Flashcard"
                  className="w-full py-2 px-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors flex items-center justify-center gap-1"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Học ngay</span>
                </button>
              </Link>
              <Link href={`/sets/${set.code}/quiz`}>
                <button
                  type="button"
                  title="Thi thử trắc nghiệm"
                  className="py-2 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors flex items-center justify-center"
                >
                  <Award className="w-4 h-4" />
                </button>
              </Link>
            </div>
          ) : (
            <button
              type="button"
              disabled
              title="Mã đề chưa có câu hỏi để bắt đầu học"
              className="w-full py-2 px-2.5 rounded-xl bg-slate-200 text-slate-400 cursor-not-allowed text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5"
            >
              <Play className="w-4 h-4" />
              <span>Học ngay</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
