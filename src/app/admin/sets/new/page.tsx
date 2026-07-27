import Link from "next/link";
import { SetForm } from "@/components/forms/SetForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function NewSetPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/sets"
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-200/60 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="sr-only">Quay lại</span>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tạo mã đề mới</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Điền các thông tin cơ bản để tạo bộ câu hỏi flashcard mới.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin mã đề</CardTitle>
        </CardHeader>
        <CardContent>
          <SetForm />
        </CardContent>
      </Card>
    </div>
  );
}
