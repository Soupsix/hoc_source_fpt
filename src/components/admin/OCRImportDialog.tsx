"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { scanImageOCRAction, type OCRQuestionResult } from "@/actions/ocrScan";
import { importQuestionsAction } from "@/actions/questions";
import { Button } from "@/components/ui/button";
import {
  Scan,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Plus,
  HelpCircle,
  Sparkles,
  X,
  ClipboardCheck,
} from "lucide-react";

interface OCRImportDialogProps {
  setId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function OCRImportDialog({
  setId,
  isOpen,
  onClose,
}: OCRImportDialogProps) {
  const router = useRouter();

  // Step state: 'UPLOAD' | 'REVIEW'
  const [step, setStep] = useState<"UPLOAD" | "REVIEW">("UPLOAD");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Scanning progress status: { current, total, filename }
  const [scanProgress, setScanProgress] = useState<{
    current: number;
    total: number;
    filename: string;
  } | null>(null);

  // Scanned questions list for review
  const [questions, setQuestions] = useState<OCRQuestionResult[]>([]);

  // Helper to add image files to list
  const addImageFiles = useCallback((newFiles: File[]) => {
    const imageFiles = newFiles.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      setError("Vui lòng chọn hoặc dán file định dạng hình ảnh (PNG, JPG, JPEG)!");
      return;
    }

    setSelectedFiles((prev) => {
      const updated = [...prev, ...imageFiles];
      const urls = updated.map((file) => URL.createObjectURL(file));
      setPreviewUrls(urls);
      return updated;
    });
    setError(null);
  }, []);

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      const urls = updated.map((file) => URL.createObjectURL(file));
      setPreviewUrls(urls);
      return updated;
    });
  };

  // Listen for Ctrl+V paste events (can paste multiple images)
  useEffect(() => {
    if (!isOpen || step !== "UPLOAD") return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf("image") !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            const fileName = `pasted_ocr_${Date.now()}_${i + 1}.png`;
            pastedFiles.push(new File([blob], fileName, { type: blob.type }));
          }
        }
      }

      if (pastedFiles.length > 0) {
        addImageFiles(pastedFiles);
        e.preventDefault();
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [isOpen, step, addImageFiles]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      addImageFiles(files);
    }
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
    if (files.length > 0) {
      addImageFiles(files);
    }
  };

  const handleStartScan = async () => {
    if (selectedFiles.length === 0) {
      setError("Vui lòng chọn ít nhất 1 file ảnh đề thi!");
      return;
    }

    setIsScanning(true);
    setError(null);

    let completedCount = 0;
    setScanProgress({
      current: 0,
      total: selectedFiles.length,
      filename: `Đang quét song song ${selectedFiles.length} ảnh...`,
    });

    try {
      // Execute all image OCR scans in parallel using Promise.all
      const scanPromises = selectedFiles.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const res = await scanImageOCRAction(formData);

        completedCount++;
        setScanProgress({
          current: completedCount,
          total: selectedFiles.length,
          filename: `Vừa xong ảnh: ${file.name}`,
        });

        if (res.success && res.questions) {
          return res.questions;
        } else {
          console.warn(`Lỗi khi quét file ${file.name}:`, res.error);
          return [];
        }
      });

      const resultsArray = await Promise.all(scanPromises);
      // Flatten questions list from all parallel scanned files
      const allQuestions: OCRQuestionResult[] = resultsArray.flat();

      setIsScanning(false);
      setScanProgress(null);

      if (allQuestions.length === 0) {
        setError("Không tìm thấy câu hỏi nào từ danh sách ảnh đã quét.");
        return;
      }

      setQuestions(allQuestions);
      setStep("REVIEW");
    } catch (err: any) {
      setIsScanning(false);
      setScanProgress(null);
      setError("Lỗi xảy ra trong quá trình quét ảnh song song: " + (err.message || ""));
    }
  };

  const handleUpdateQuestion = (index: number, field: keyof OCRQuestionResult, value: any) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleOptionChange = (qIndex: number, optIndex: number, text: string) => {
    setQuestions((prev) => {
      const next = [...prev];
      const newOpts = [...next[qIndex].options];
      newOpts[optIndex] = text;
      next[qIndex] = { ...next[qIndex], options: newOpts };
      return next;
    });
  };

  const handleAddOption = (qIndex: number) => {
    setQuestions((prev) => {
      const next = [...prev];
      const labels = ["A", "B", "C", "D", "E", "F"];
      const currentOpts = next[qIndex].options;
      const nextLabel = labels[currentOpts.length] || `Option ${currentOpts.length + 1}`;
      next[qIndex] = {
        ...next[qIndex],
        options: [...currentOpts, `${nextLabel}. Lựa chọn mới`],
      };
      return next;
    });
  };

  const handleRemoveOption = (qIndex: number, optIndex: number) => {
    setQuestions((prev) => {
      const next = [...prev];
      const newOpts = next[qIndex].options.filter((_, idx) => idx !== optIndex);
      next[qIndex] = { ...next[qIndex], options: newOpts };
      return next;
    });
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question: "Câu hỏi mới",
        options: ["A. Lựa chọn 1", "B. Lựa chọn 2", "C. Lựa chọn 3", "D. Lựa chọn 4"],
        type: "SINGLE_CHOICE",
        answer: "",
        explanation: "",
      },
    ]);
  };

  const handleSaveToDatabase = async () => {
    setError(null);

    if (questions.length === 0) {
      setError("Danh sách câu hỏi đang trống!");
      return;
    }

    // Validate that single choice questions have an answer
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (q.type === "SINGLE_CHOICE" && !q.answer) {
        setError(`Câu ${i + 1} chưa được chọn đáp án đúng! Vui lòng chọn đáp án trước khi lưu.`);
        return;
      }
    }

    setIsSubmitting(true);
    const res = await importQuestionsAction(setId, questions);
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || "Không thể lưu câu hỏi vào cơ sở dữ liệu.");
      return;
    }

    onClose();
    router.refresh();
  };

  const handleReset = () => {
    setStep("UPLOAD");
    setSelectedFiles([]);
    setPreviewUrls([]);
    setQuestions([]);
    setError(null);
    setScanProgress(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full p-6 border border-slate-100 space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Scan className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Scan & Nhập Đề Thi Bằng VietOCR</h3>
              <p className="text-xs text-slate-500">
                {step === "UPLOAD"
                  ? "Tải lên ảnh chụp đề thi để AI tự động nhận diện chữ tiếng Việt chuẩn dấu"
                  : "Kiểm duyệt nội dung, chọn đáp án đúng và nhập giải thích trước khi lưu vào Mã đề"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Upload Image */}
        {step === "UPLOAD" && (
          <div className="space-y-6">
            {/* Progress Bar Indicator during OCR scanning */}
            {isScanning && scanProgress && (
              <div className="space-y-2 bg-indigo-50/80 border border-indigo-200 rounded-2xl p-4 shadow-sm animate-pulse">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    Đang quét VietOCR ({scanProgress.current}/{scanProgress.total})
                  </span>
                  <span className="font-mono text-indigo-700">
                    {Math.round((scanProgress.current / scanProgress.total) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-indigo-200/60 rounded-full h-3 overflow-hidden shadow-inner">
                  <div
                    className="bg-indigo-600 h-full transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${(scanProgress.current / scanProgress.total) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-indigo-700 font-medium truncate pt-1">
                  📄 Đang xử lý file: <strong>{scanProgress.filename}</strong>
                </p>
              </div>
            )}

            {/* Dropzone Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                isDragging
                  ? "border-indigo-500 bg-indigo-50/70 scale-[1.01]"
                  : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
              }`}
            >
              {previewUrls.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Đã chọn {selectedFiles.length} ảnh đề thi:
                    </span>
                    <label
                      htmlFor="ocr-file-upload-more"
                      className="text-xs text-indigo-600 font-semibold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm ảnh nữa
                    </label>
                  </div>

                  {/* Thumbnail Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-1">
                    {previewUrls.map((url, index) => (
                      <div
                        key={index}
                        className="relative group bg-white rounded-xl border border-slate-200 p-2 shadow-2xs flex flex-col items-center"
                      >
                        <img
                          src={url}
                          alt={`Scan ${index + 1}`}
                          className="h-24 w-full object-cover rounded-lg border border-slate-100"
                        />
                        <p className="text-[10px] text-slate-600 font-medium truncate w-full mt-1.5 text-center">
                          {selectedFiles[index]?.name}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-1 shadow-md hover:bg-rose-600 transition-colors"
                          title="Xóa ảnh này"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800">Kéo thả nhiều file ảnh vào đây hoặc bấm chọn file</p>
                    <p className="text-xs text-slate-500">Hỗ trợ chọn nhiều ảnh PNG, JPG, JPEG cùng lúc (Đề thi nhiều trang)</p>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50/80 border border-indigo-100 text-indigo-700 rounded-lg text-xs font-medium">
                    <ClipboardCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Mẹo: Nhấn <kbd className="px-1.5 py-0.5 bg-white border border-indigo-200 rounded font-mono font-bold shadow-2xs text-indigo-900">Ctrl + V</kbd> để dán thêm các ảnh chụp màn hình!</span>
                  </div>
                </div>
              )}

              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="ocr-file-upload"
              />
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="ocr-file-upload-more"
              />

              <div className="mt-4">
                <label
                  htmlFor="ocr-file-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer shadow-xs transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {selectedFiles.length > 0 ? "Thêm ảnh khác" : "Chọn file ảnh"}
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={onClose} disabled={isScanning}>
                Hủy bỏ
              </Button>
              <Button
                type="button"
                onClick={handleStartScan}
                disabled={selectedFiles.length === 0 || isScanning}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-2"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang quét ({scanProgress?.current || 0}/{selectedFiles.length})...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Bắt đầu quét {selectedFiles.length > 0 ? `${selectedFiles.length} ảnh` : ""} (VietOCR)
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Interactive Review */}
        {step === "REVIEW" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-indigo-50/70 border border-indigo-100 rounded-xl p-3.5 text-xs text-indigo-900">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Đã quét thành công <strong>{questions.length}</strong> câu hỏi. Hãy kiểm tra nội dung và tích chọn đáp án đúng cho từng câu.</span>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="text-indigo-700 underline font-semibold hover:text-indigo-900"
              >
                Quét ảnh khác
              </button>
            </div>

            {/* Questions Review Cards */}
            <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2">
              {questions.map((q, qIndex) => (
                <div
                  key={qIndex}
                  className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-4 space-y-4 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {qIndex + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-700">Câu hỏi {qIndex + 1}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={q.type}
                        onChange={(e) => handleUpdateQuestion(qIndex, "type", e.target.value)}
                        className="text-xs border border-slate-200 rounded-lg px-2.5 py-1 bg-white font-semibold text-slate-700"
                      >
                        <option value="SINGLE_CHOICE">Trắc nghiệm 1 đáp án</option>
                        <option value="MULTIPLE_CHOICE">Trắc nghiệm nhiều đáp án</option>
                        <option value="FLASHCARD">Flashcard Tự Luận</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIndex)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Xóa câu này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nội dung câu hỏi:</label>
                    <textarea
                      value={q.question}
                      onChange={(e) => handleUpdateQuestion(qIndex, "question", e.target.value)}
                      rows={2}
                      className="w-full text-xs font-medium border border-slate-200 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  {/* Options List for Choice Types */}
                  {q.type !== "FLASHCARD" && (
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-700">
                        Danh sách phương án (Tích chọn ô tròn để đánh dấu đáp án đúng):
                      </label>
                      {q.options.map((opt, optIndex) => {
                        const isSelected = q.answer === opt;
                        return (
                          <div key={optIndex} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-answer-${qIndex}`}
                              checked={isSelected}
                              onChange={() => handleUpdateQuestion(qIndex, "answer", opt)}
                              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 shrink-0 cursor-pointer"
                              title="Tích chọn làm đáp án đúng"
                            />
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                              className={`w-full text-xs border rounded-lg p-2 bg-white ${
                                isSelected
                                  ? "border-emerald-500 font-bold bg-emerald-50/40 text-emerald-900"
                                  : "border-slate-200 text-slate-800"
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(qIndex, optIndex)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddOption(qIndex)}
                        className="text-xs text-indigo-600 gap-1.5 h-7 mt-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Thêm lựa chọn
                      </Button>
                    </div>
                  )}

                  {/* Explanation */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Lời giải thích (Tùy chọn):</label>
                    <textarea
                      value={q.explanation}
                      onChange={(e) => handleUpdateQuestion(qIndex, "explanation", e.target.value)}
                      placeholder="Nhập lời giải thích chi tiết cho câu hỏi..."
                      rows={1}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white text-slate-800"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={handleAddQuestion}
                className="text-xs font-semibold gap-1.5"
              >
                <Plus className="w-4 h-4" /> Thêm câu mới thủ công
              </Button>

              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  Hủy bỏ
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveToDatabase}
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang lưu vào PostgreSQL...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Xác Nhận & Lưu Vào Mã Đề
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
