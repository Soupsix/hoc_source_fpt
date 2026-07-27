import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion, ArrowLeft } from "lucide-react";

export default function SetNotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
      <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-4">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900">Không tìm thấy mã đề</h2>
      <p className="mt-2 text-slate-500 max-w-md">
        Mã đề bạn đang tìm kiếm không tồn tại hoặc đã bị xóa khỏi hệ thống.
      </p>
      <div className="mt-6">
        <Link href="/admin/sets">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách mã đề
          </Button>
        </Link>
      </div>
    </div>
  );
}
