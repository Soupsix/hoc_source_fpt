"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, BookOpen, Filter, X } from "lucide-react";

interface PublicCategoryFilterProps {
  semesters: string[];
  subjects: string[];
  currentSemester?: string;
  currentSubject?: string;
}

export function PublicCategoryFilter({
  semesters,
  subjects,
  currentSemester = "",
  currentSubject = "",
}: PublicCategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleSelectSemester = (sem: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (sem && sem !== "ALL") {
      params.set("semester", sem);
    } else {
      params.delete("semester");
    }
    params.delete("page");

    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  };

  const handleSelectSubject = (subj: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (subj && subj !== "ALL") {
      params.set("subject", subj);
    } else {
      params.delete("subject");
    }
    params.delete("page");

    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  };

  const handleClearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("semester");
    params.delete("subject");
    params.delete("page");

    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  };

  const hasActiveCategoryFilters = Boolean(currentSemester || currentSubject);

  return (
    <div className={`bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 transition-opacity ${isPending ? "opacity-70 pointer-events-none" : ""}`}>
      {/* Header filter title & clear button */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <Filter className="w-4 h-4 text-indigo-600" />
          <span>Phân loại theo Kỳ học &amp; Mã môn</span>
        </div>

        {hasActiveCategoryFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Xóa lọc phân loại</span>
          </button>
        )}
      </div>

      {/* Semester Filter Tabs */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
          <span>Theo Kỳ học:</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => handleSelectSemester("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              !currentSemester
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Tất cả kỳ
          </button>

          {semesters.map((sem) => {
            const isSelected = currentSemester === sem;
            return (
              <button
                key={sem}
                type="button"
                onClick={() => handleSelectSemester(sem)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {sem}
              </button>
            );
          })}
        </div>
      </div>

      {/* Subject Filter Pills */}
      {subjects.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
            <span>Theo Mã môn:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleSelectSubject("ALL")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                !currentSubject
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Tất cả môn
            </button>

            {subjects.map((subj) => {
              const isSelected = currentSubject === subj;
              return (
                <button
                  key={subj}
                  type="button"
                  onClick={() => handleSelectSubject(subj)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {subj}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
