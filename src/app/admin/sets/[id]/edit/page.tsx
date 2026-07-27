import Link from "next/link";
import { notFound } from "next/navigation";
import { getQuestionSetById } from "@/actions/sets";
import { SetForm } from "@/components/forms/SetForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSetPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const res = await getQuestionSetById(id);

  if (!res.success || !res.data) {
    notFound();
  }

  const set = res.data;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/sets/${id}`}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-200/60 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="sr-only">Quay lại</span>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Chỉnh sửa mã đề: {set.code}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Cập nhật thông tin chi tiết cho bộ câu hỏi flashcard.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin mã đề</CardTitle>
        </CardHeader>
        <CardContent>
          <SetForm
            initialData={{
              id: set.id,
              code: set.code,
              title: set.title,
              description: set.description,
              isPublished: set.isPublished,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
