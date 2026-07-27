"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createQuestionAction, updateQuestionAction } from "@/actions/questions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Plus, Trash2, Sparkles, Zap } from "lucide-react";
import { QuestionType } from "@/types/question";
import { parseQuickQuestion } from "@/lib/utils";

export interface QuestionEditData {
  id?: string;
  type: QuestionType;
  question: string;
  answer: string;
  options?: string[] | null;
  explanation?: string | null;
}

interface QuestionFormDialogProps {
  setId: string;
  isOpen: boolean;
  onClose: () => void;
  initialData?: QuestionEditData | null;
}

export function QuestionFormDialog({
  setId,
  isOpen,
  onClose,
  initialData,
}: QuestionFormDialogProps) {
  const router = useRouter();
  const isEditing = Boolean(initialData?.id);

  const [type, setType] = useState<QuestionType>(initialData?.type || "FLASHCARD");
  const [question, setQuestion] = useState(initialData?.question || "");
  const [answer, setAnswer] = useState(initialData?.answer || "");
  const [options, setOptions] = useState<string[]>(
    Array.isArray(initialData?.options) && initialData.options.length > 0
      ? initialData.options
      : ["", ""]
  );
  const [explanation, setExplanation] = useState(initialData?.explanation || "");
  const [quickInput, setQuickInput] = useState("");
  const [parseSuccessMsg, setParseSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleQuickParse = () => {
    if (!quickInput.trim()) return;
    const { question: parsedQuestion, options: parsedOptions } = parseQuickQuestion(quickInput);

    if (!parsedQuestion && parsedOptions.length === 0) {
      setError("Không thể nhận diện nội dung câu hỏi hoặc các lựa chọn.");
      return;
    }

    if (parsedQuestion) {
      setQuestion(parsedQuestion);
    }

    if (parsedOptions.length > 0) {
      setOptions(parsedOptions);
      if (type === "FLASHCARD") {
        setType("SINGLE_CHOICE");
      }
    }

    setError(null);
    setParseSuccessMsg(
      `Đã tách tự động: ${parsedQuestion ? "Nội dung câu hỏi" : ""} ${
        parsedOptions.length > 0 ? `và ${parsedOptions.length} phương án` : ""
      }`
    );
    setQuickInput("");
  };

  const handleAddOption = () => {
    setOptions((prev) => [...prev, ""]);
  };

  const handleRemoveOption = (index: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, val: string) => {
    setOptions((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim()) {
      setError("Vui lòng nhập nội dung câu hỏi.");
      return;
    }
    if (!answer.trim()) {
      setError("Vui lòng nhập đáp án chính xác.");
      return;
    }

    if (type !== "FLASHCARD") {
      const validOptions = options.map((o) => o.trim()).filter(Boolean);
      if (validOptions.length < 2) {
        setError("Vui lòng nhập ít nhất 2 phương án lựa chọn.");
        return;
      }
    }

    setError(null);
    setIsSubmitting(true);

    const formattedOptions =
      type !== "FLASHCARD" ? options.map((o) => o.trim()).filter(Boolean) : undefined;

    const payload = {
      type,
      question: question.trim(),
      answer: answer.trim(),
      options: formattedOptions,
      explanation: explanation.trim() || undefined,
      order: 0,
    };

    try {
      if (isEditing && initialData?.id) {
        const res = await updateQuestionAction(initialData.id, payload);
        if (!res.success) {
          setError(res.error || "Không thể cập nhật câu hỏi.");
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await createQuestionAction(setId, payload);
        if (!res.success) {
          setError(res.error || "Không thể tạo câu hỏi.");
          setIsSubmitting(false);
          return;
        }
      }

      onClose();
      router.refresh();
    } catch {
      setError("Đã xảy ra lỗi. Vui lòng thử lại.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 border border-slate-100 space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-lg font-bold text-slate-900">
            {isEditing ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi mới"}
          </h3>
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
          {/* Quick Import Parser Box */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="quickImport" className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 cursor-pointer">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Dán nhanh đoạn văn bản (Tự động tách câu hỏi &amp; phương án A, B, C, D)
              </label>
            </div>
            <Textarea
              id="quickImport"
              placeholder="Ví dụ: Which API platform is used for capturing user's location data? A. LocationPicker B. Geolocation C. Location D. Picker"
              rows={2}
              value={quickInput}
              onChange={(e) => {
                setQuickInput(e.target.value);
                setParseSuccessMsg(null);
              }}
              className="bg-white text-xs"
            />
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-xs text-emerald-600 font-semibold truncate">
                {parseSuccessMsg && `✓ ${parseSuccessMsg}`}
              </span>
              <Button
                type="button"
                size="sm"
                onClick={handleQuickParse}
                disabled={!quickInput.trim()}
                className="text-xs gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 shrink-0 ml-auto"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                Tách nhanh
              </Button>
            </div>
          </div>

          {/* Question Type Selection */}
          {/* Question Type Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Loại câu hỏi
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType("FLASHCARD")}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  type === "FLASHCARD"
                    ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Flashcard
              </button>
              <button
                type="button"
                onClick={() => setType("SINGLE_CHOICE")}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  type === "SINGLE_CHOICE"
                    ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                1 Đáp án đúng
              </button>
              <button
                type="button"
                onClick={() => setType("MULTIPLE_CHOICE")}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  type === "MULTIPLE_CHOICE"
                    ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Nhiều đáp án đúng
              </button>
            </div>
          </div>

          {/* Question Content */}
          <Textarea
            label="Nội dung câu hỏi *"
            placeholder="Nhập câu hỏi..."
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />

          {/* Options for Choice Questions */}
          {type !== "FLASHCARD" && (
            <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase text-slate-600">
                  Các lựa chọn trắc nghiệm *
                </label>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm phương án
                </button>
              </div>

              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400 w-5">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    <Input
                      placeholder={`Phương án ${String.fromCharCode(65 + idx)}`}
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      className="bg-white text-sm"
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                        title="Xóa lựa chọn"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Answer Content */}
          <Textarea
            label="Đáp án chính xác *"
            placeholder={
              type === "FLASHCARD"
                ? "Nhập đáp án hiển thị ở mặt sau thẻ..."
                : type === "SINGLE_CHOICE"
                ? "Nhập chính xác nội dung phương án đúng (ví dụ: Đáp án A)"
                : "Nhập các đáp án đúng cách nhau bởi dấu phẩy (ví dụ: Đáp án A, Đáp án B)"
            }
            rows={2}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />

          {/* Explanation */}
          <Textarea
            label="Giải thích thêm (Tùy chọn)"
            placeholder="Nhập giải thích cho đáp án..."
            rows={2}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
          />

          {/* Form Actions */}
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
              {isEditing ? "Lưu thay đổi" : "Tạo câu hỏi"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
