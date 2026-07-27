"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", pageNumber.toString());
    return `/?${params.toString()}`;
  };

  const pages = [];
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2 pt-6">
      {/* Previous Page */}
      {currentPage > 1 ? (
        <Link
          href={createPageUrl(currentPage - 1)}
          className="p-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
          title="Trang trước"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="sr-only">Trang trước</span>
        </Link>
      ) : (
        <button
          disabled
          className="p-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="sr-only">Trang trước</span>
        </button>
      )}

      {/* Page Numbers */}
      {startPage > 1 && (
        <>
          <Link
            href={createPageUrl(1)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
          >
            1
          </Link>
          {startPage > 2 && <span className="px-1 text-slate-400 text-sm">...</span>}
        </>
      )}

      {pages.map((p) => (
        <Link
          key={p}
          href={createPageUrl(p)}
          className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
            p === currentPage
              ? "bg-indigo-600 text-white shadow-xs"
              : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          {p}
        </Link>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-1 text-slate-400 text-sm">...</span>}
          <Link
            href={createPageUrl(totalPages)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {totalPages}
          </Link>
        </>
      )}

      {/* Next Page */}
      {currentPage < totalPages ? (
        <Link
          href={createPageUrl(currentPage + 1)}
          className="p-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
          title="Trang sau"
        >
          <ChevronRight className="w-4 h-4" />
          <span className="sr-only">Trang sau</span>
        </Link>
      ) : (
        <button
          disabled
          className="p-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
          <span className="sr-only">Trang sau</span>
        </button>
      )}
    </div>
  );
}
