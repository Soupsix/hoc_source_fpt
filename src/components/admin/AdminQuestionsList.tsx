"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { QuestionFormDialog, QuestionEditData } from "./QuestionFormDialog";
import { ImportQuestionsDialog } from "./ImportQuestionsDialog";
import { deleteQuestionAction, moveQuestionOrderAction } from "@/actions/questions";
import { parseOptionsArray, formatOptionText } from "@/lib/utils";
import { Plus, Upload, Edit3, Trash2, ArrowUp, ArrowDown, HelpCircle } from "lucide-react";

export interface QuestionListItem {
  id: string;
  type: "FLASHCARD" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
  question: string;
  answer: string;
  options?: unknown;
  explanation: string | null;
  order: number;
}

interface AdminQuestionsListProps {
  setId: string;
  questions: QuestionListItem[];
}

export function AdminQuestionsList({ setId, questions }: AdminQuestionsListProps) {
  const router = useRouter();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionEditData | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleMove = async (id: string, direction: "up" | "down") => {
    await moveQuestionOrderAction(id, direction);
    router.refresh();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      const res = await deleteQuestionAction(deleteTargetId);
      if (res.success) {
        setDeleteTargetId(null);
        router.refresh();
      } else {
        alert(res.error || "Không thể xóa câu hỏi.");
      }
    } catch {
      alert("Đã xảy ra lỗi khi xóa câu hỏi.");
    } finally {
      setIsDeleting(false);
    }
  };

  const renderTypeBadge = (type: string) => {
    switch (type) {
      case "SINGLE_CHOICE":
        return <Badge variant="info">Trắc nghiệm (1 đáp án)</Badge>;
      case "MULTIPLE_CHOICE":
        return <Badge variant="warning">Trắc nghiệm (Nhiều đáp án)</Badge>;
      default:
        return <Badge variant="neutral">Flashcard</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-600" />
          Danh sách câu hỏi ({questions.length})
        </h3>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportOpen(true)}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Import câu hỏi
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setEditingQuestion(null);
              setIsAddOpen(true);
            }}
            className="gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Thêm câu hỏi
          </Button>
        </div>
      </div>

      {/* Question Items List */}
      {questions.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h4 className="text-base font-semibold text-slate-900">
            Chưa có câu hỏi nào trong mã đề này
          </h4>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Bắt đầu bằng cách bấm nút &quot;Thêm câu hỏi&quot; hoặc &quot;Import câu hỏi&quot; ở góc phải.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button size="sm" onClick={() => setIsAddOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Thêm câu hỏi mới
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, idx) => {
            const parsedOptions = parseOptionsArray(q.options);

            return (
              <div
                key={q.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      #{idx + 1}
                    </span>
                    {renderTypeBadge(q.type)}
                  </div>

                  <p className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                    {formatOptionText(q.question)}
                  </p>

                  {/* Options List */}
                  {parsedOptions && parsedOptions.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-xs text-slate-600">
                      {parsedOptions.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/60 font-mono"
                        >
                          <strong className="text-slate-400 mr-1.5">
                            {String.fromCharCode(65 + oIdx)}.
                          </strong>
                          {formatOptionText(opt)}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-xs text-slate-700 pt-1">
                    <strong className="text-emerald-700">Đáp án:</strong> {formatOptionText(q.answer)}
                  </div>

                  {q.explanation && (
                    <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <strong>Giải thích:</strong> {formatOptionText(q.explanation)}
                    </p>
                  )}
                </div>

                {/* Control Action Buttons */}
                <div className="flex items-center gap-1 shrink-0 self-end sm:self-start">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMove(q.id, "up")}
                    disabled={idx === 0}
                    className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900"
                    title="Di chuyển lên"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMove(q.id, "down")}
                    disabled={idx === questions.length - 1}
                    className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900"
                    title="Di chuyển xuống"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingQuestion({
                        id: q.id,
                        type: q.type,
                        question: formatOptionText(q.question),
                        answer: formatOptionText(q.answer),
                        options: parsedOptions,
                        explanation: q.explanation ? formatOptionText(q.explanation) : null,
                      });
                      setIsAddOpen(true);
                    }}
                    className="h-8 w-8 p-0 text-slate-500 hover:text-amber-600"
                    title="Chỉnh sửa"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTargetId(q.id)}
                    className="h-8 w-8 p-0 text-slate-500 hover:text-red-600 hover:bg-red-50"
                    title="Xóa câu hỏi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Question Dialog */}
      <QuestionFormDialog
        setId={setId}
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setEditingQuestion(null);
        }}
        initialData={editingQuestion}
      />

      {/* Import Questions Dialog */}
      <ImportQuestionsDialog
        setId={setId}
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa câu hỏi"
        description="Bạn có chắc chắn muốn xóa câu hỏi này khỏi mã đề? Thao tác không thể hoàn tác."
        confirmText="Xóa câu hỏi"
        cancelText="Hủy"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
