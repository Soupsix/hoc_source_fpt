"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAdminAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, BookOpen, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) {
      setError("Vui lòng nhập mã truy cập Admin.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await loginAdminAction(accessCode.trim());
      if (!res.success) {
        setError(res.error || "Mã truy cập không chính xác.");
        setIsLoading(false);
        return;
      }
      router.push("/admin/sets");
      router.refresh();
    } catch {
      setError("Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-slate-800 shadow-2xl bg-slate-950 text-slate-100">
        <CardHeader className="text-center border-slate-800 pb-2">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-indigo-600/30">
            <BookOpen className="w-6 h-6" />
          </div>
          <CardTitle className="text-xl text-white">Đăng nhập Admin</CardTitle>
          <p className="text-xs text-slate-400 mt-1">
            Nhập mã truy cập cố định để quản lý các mã đề flashcard.
          </p>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-lg bg-red-950/50 border border-red-800/60 text-red-200 text-sm flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="relative">
              <Input
                type="password"
                placeholder="Nhập mã truy cập Admin..."
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                autoFocus
                className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 focus:border-indigo-500"
              />
            </div>

            <Button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white gap-2 font-medium"
              isLoading={isLoading}
            >
              <Lock className="w-4 h-4" />
              Đăng nhập
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
