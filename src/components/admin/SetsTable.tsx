"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteSetDialog } from "./DeleteSetDialog";
import { Eye, Edit3, Trash2, Search, Plus, FolderOpen } from "lucide-react";

export interface QuestionSetItem {
  id: string;
  code: string;
  title: string;
  description: string | null;
  isPublished: boolean;
  updatedAt: Date | string;
  _count?: {
    questions: number;
  };
}

interface SetsTableProps {
  initialSets: QuestionSetItem[];
  initialQuery?: string;
}

export function SetsTable({ initialSets, initialQuery = "" }: SetsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; code: string } | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery.trim()) {
      params.set("q", searchQuery.trim());
    } else {
      params.delete("q");
    }

    startTransition(() => {
      router.push(`/admin/sets?${params.toString()}`);
    });
  };

  const formatDate = (dateInput: Date | string) => {
    const d = new Date(dateInput);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo mã đề hoặc tên đề..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
          <Button type="submit" variant="secondary" isLoading={isPending}>
            Tìm
          </Button>
        </form>

        <Link href="/admin/sets/new">
          <Button className="w-full sm:w-auto gap-2 shadow-xs">
            <Plus className="w-4 h-4" />
            Tạo mã đề
          </Button>
        </Link>
      </div>

      {/* Sets Table / Cards */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {initialSets.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
              <FolderOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Chưa có mã đề nào</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
              {initialQuery
                ? `Không tìm thấy mã đề phù hợp với từ khóa "${initialQuery}".`
                : "Danh sách mã đề hiện tại đang trống. Bắt đầu bằng cách tạo mã đề đầu tiên."}
            </p>
            {!initialQuery && (
              <div className="mt-5">
                <Link href="/admin/sets/new">
                  <Button size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Tạo mã đề mới
                  </Button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th scope="col" className="px-6 py-3.5">Mã đề</th>
                  <th scope="col" className="px-6 py-3.5">Tên đề</th>
                  <th scope="col" className="px-6 py-3.5">Số câu hỏi</th>
                  <th scope="col" className="px-6 py-3.5">Trạng thái</th>
                  <th scope="col" className="px-6 py-3.5">Cập nhật</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {initialSets.map((set) => (
                  <tr key={set.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-semibold text-indigo-600">
                      <Link href={`/admin/sets/${set.id}`} className="hover:underline">
                        {set.code}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 max-w-xs truncate">{set.title}</div>
                      {set.description && (
                        <div className="text-xs text-slate-500 max-w-xs truncate mt-0.5">
                          {set.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {set._count?.questions ?? 0} câu
                    </td>
                    <td className="px-6 py-4">
                      {set.isPublished ? (
                        <Badge variant="success">Đã xuất bản</Badge>
                      ) : (
                        <Badge variant="neutral">Bản nháp</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(set.updatedAt)}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/sets/${set.id}`} title="Mở mã đề">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600">
                            <Eye className="w-4 h-4" />
                            <span className="sr-only">Mở</span>
                          </Button>
                        </Link>

                        <Link href={`/admin/sets/${set.id}/edit`} title="Chỉnh sửa">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-amber-600">
                            <Edit3 className="w-4 h-4" />
                            <span className="sr-only">Sửa</span>
                          </Button>
                        </Link>

                        <Button
                          variant="ghost"
                          size="sm"
                          title="Xóa mã đề"
                          onClick={() => setDeleteTarget({ id: set.id, code: set.code })}
                          className="h-8 w-8 p-0 text-slate-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="sr-only">Xóa</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <DeleteSetDialog
          setId={deleteTarget.id}
          setCode={deleteTarget.code}
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onSuccess={() => {
            setDeleteTarget(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
