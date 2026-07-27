"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

interface PublicSearchFormProps {
  initialQuery?: string;
}

export function PublicSearchForm({ initialQuery = "" }: PublicSearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(initialQuery);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  const executeSearch = (searchTerm: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = searchTerm.trim();

    if (trimmed) {
      params.set("q", trimmed);
    } else {
      params.delete("q");
    }
    params.delete("page");

    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  };

  const handleClear = () => {
    setQuery("");
    executeSearch("");
  };

  return (
    <form onSubmit={handleSearch} className="w-full">
      <div className="relative flex items-center w-full">
        <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Tìm kiếm theo mã đề, tên đề hoặc mô tả..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-11 pr-24 py-3 bg-white text-slate-900 text-base rounded-xl border border-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs transition-colors"
        />

        <div className="absolute right-2 flex items-center gap-1.5">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Xóa từ khóa"
            >
              <X className="w-4 h-4" />
              <span className="sr-only">Xóa</span>
            </button>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors"
          >
            {isPending ? "Đang tìm..." : "Tìm"}
          </button>
        </div>
      </div>
    </form>
  );
}
