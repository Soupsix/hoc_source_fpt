"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { importQuestionsAction } from "@/actions/questions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, FileCode, CheckCircle2 } from "lucide-react";

interface ImportQuestionsDialogProps {
  setId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ImportQuestionsDialog({
  setId,
  isOpen,
  onClose,
}: ImportQuestionsDialogProps) {
  const router = useRouter();
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const sampleJson = JSON.stringify(
    [
      {
        type: "FLASHCARD",
        question: "React là gì?",
        answer: "Là thư viện UI của Facebook",
        explanation: "Phát hành năm 2013",
      },
      {
        type: "SINGLE_CHOICE",
        question: "Thành phần chính trong React là gì?",
        answer: "Component",
        options: ["Component", "Controller", "Model", "View"],
        explanation: "React xây dựng UI dựa trên Component",
      },
    ],
    null,
    2
  );

  const handleFillSample = () => {
    setJsonText(sampleJson);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!jsonText.trim()) {
      setError("Vui lòng nhập nội dung JSON.");
      return;
    }

    try {
      const parsed = JSON.parse(jsonText.trim());
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setError("Dữ liệu JSON phải là một mảng danh sách câu hỏi.");
        return;
      }

      setIsSubmitting(true);
      const res = await importQuestionsAction(setId, parsed);
      if (!res.success) {
        setError(res.error || "Không thể import câu hỏi.");
        setIsSubmitting(false);
        return;
      }

      setJsonText("");
      onClose();
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(`Cú pháp JSON không hợp lệ: ${err.message}`);
      } else {
        setError("Cú pháp JSON không hợp lệ.");
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 border border-slate-100 space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900">Import hàng loạt câu hỏi (JSON)</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold uppercase text-slate-500">
              Dán nội dung mảng JSON
            </label>
            <button
              type="button"
              onClick={handleFillSample}
              className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Điền dữ liệu mẫu
            </button>
          </div>

          <Textarea
            rows={10}
            placeholder={`[\n  {\n    "type": "FLASHCARD",\n    "question": "...",\n    "answer": "..."\n  }\n]`}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="font-mono text-xs bg-slate-900 text-slate-100 border-slate-800"
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Import ngay
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
