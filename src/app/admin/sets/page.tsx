import { getQuestionSets } from "@/actions/sets";
import { SetsTable } from "@/components/admin/SetsTable";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SetsPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || "";

  const res = await getQuestionSets(query);
  const sets = res.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý mã đề</h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý danh sách các bộ câu hỏi flashcard trong hệ thống.
          </p>
        </div>
      </div>

      <SetsTable initialSets={sets} initialQuery={query} />
    </div>
  );
}
