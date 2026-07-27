import Link from "next/link";
import { BookOpen, ShieldCheck } from "lucide-react";

export function PublicHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 group-hover:bg-indigo-700 transition-colors">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-slate-900 leading-tight tracking-tight">
              Flashcard Learning
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Thư viện câu hỏi & Thẻ nhớ
            </span>
          </div>
        </Link>

        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors px-3 py-2 rounded-lg border border-slate-200 hover:border-indigo-200 bg-slate-50 hover:bg-indigo-50/50"
        >
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span className="hidden sm:inline">Trang Quản trị</span>
        </Link>
      </div>
    </header>
  );
}
