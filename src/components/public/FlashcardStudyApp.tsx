"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatOptionText, parseOptionsArray, resolveAnswer, isCorrectAnswer } from "@/lib/utils";
import {
  ArrowLeft,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  RefreshCw,
  BookOpen,
  Award,
  Check,
  Square,
  BookOpenCheck,
} from "lucide-react";

interface QuestionItem {
  id: string;
  question: string;
  answer: string;
  options?: unknown;
  explanation: string | null;
  order: number;
}

interface FlashcardStudyAppProps {
  setInfo: { code: string; title: string };
  questions: QuestionItem[];
}

function questionType(options: string[]): "FLASHCARD" | "SINGLE" | "MULTI" {
  if (options.length === 0) return "FLASHCARD";
  // Crude heuristic: if the stored answer contains a comma → multi
  return "SINGLE"; // actual multi detection is done per-question below
}

export function FlashcardStudyApp({ setInfo, questions }: FlashcardStudyAppProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  // Flashcard state
  const [isFlipped, setIsFlipped] = useState(false);
  // Choice state: id → string | string[]
  const [userAnswers, setUserAnswers] = useState<Record<string, string | string[]>>({});
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
  const [masteredIds, setMasteredIds] = useState<Record<string, boolean>>({});

  const totalQuestions = questions.length;
  const currentQ = questions[currentIndex];

  // Derived per-question data
  const parsedOptions = currentQ ? parseOptionsArray(currentQ.options) : [];
  const correctAnswerRaw = currentQ ? formatOptionText(currentQ.answer) : "";
  // Detect if multi-choice: answer contains comma or multiple letters
  const correctParts = correctAnswerRaw.split(",").map((s) => s.trim()).filter(Boolean);
  const isMulti = parsedOptions.length > 0 && correctParts.length > 1;
  const isSingle = parsedOptions.length > 0 && !isMulti;
  const isFlashcard = parsedOptions.length === 0;
  const isConfirmed = currentQ ? confirmedIds.has(currentQ.id) : false;
  const isMastered = currentQ ? Boolean(masteredIds[currentQ.id]) : false;

  // void usage to satisfy linter
  void questionType;

  const handleNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setIsFlipped(false);
      setCurrentIndex((p) => p + 1);
    }
  }, [currentIndex, totalQuestions]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex((p) => p - 1);
    }
  }, [currentIndex]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.code === "Space" && isFlashcard) {
        e.preventDefault();
        setIsFlipped((p) => !p);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [handleNext, handlePrev, isFlashcard]);

  const resetProgress = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setUserAnswers({});
    setConfirmedIds(new Set());
    setMasteredIds({});
  };

  // ── Choice handlers ───────────────────────────────────────────────────────
  const handleSelectOption = (optionStr: string) => {
    if (isConfirmed) return;
    if (isSingle) {
      // auto-confirm on single-choice select
      setUserAnswers((p) => ({ ...p, [currentQ.id]: optionStr }));
      setConfirmedIds((s) => new Set([...s, currentQ.id]));
    } else {
      // multi – toggle
      const prev = Array.isArray(userAnswers[currentQ.id])
        ? (userAnswers[currentQ.id] as string[])
        : [];
      const updated = prev.includes(optionStr)
        ? prev.filter((x) => x !== optionStr)
        : [...prev, optionStr];
      setUserAnswers((p) => ({ ...p, [currentQ.id]: updated }));
    }
  };

  const handleConfirmMulti = () => {
    const sel = userAnswers[currentQ.id];
    if (!Array.isArray(sel) || sel.length === 0) return;
    setConfirmedIds((s) => new Set([...s, currentQ.id]));
  };

  // ── Answer correctness ────────────────────────────────────────────────────
  const checkCorrect = () => {
    const ans = userAnswers[currentQ.id];
    const corrects = correctParts.map((p) =>
      resolveAnswer(p, parsedOptions).toLowerCase()
    );
    if (isMulti) {
      const userList = (Array.isArray(ans) ? ans : []).map((s) => s.toLowerCase());
      return corrects.length === userList.length && corrects.every((c) => userList.includes(c));
    }
    const userStr = typeof ans === "string" ? ans.toLowerCase() : "";
    const correctSingle = resolveAnswer(correctAnswerRaw, parsedOptions).toLowerCase();
    return userStr === correctSingle;
  };
  const isCurrentCorrect = isConfirmed && !isFlashcard ? checkCorrect() : false;

  // ── Option styling ────────────────────────────────────────────────────────
  const getOptionClass = (optionStr: string) => {
    const base =
      "w-full p-4 rounded-2xl border text-left text-sm sm:text-base transition-all flex items-center justify-between gap-3";
    if (!isConfirmed) {
      const selected = isMulti
        ? Array.isArray(userAnswers[currentQ.id]) &&
          (userAnswers[currentQ.id] as string[]).includes(optionStr)
        : userAnswers[currentQ.id] === optionStr;
      return `${base} ${
        selected
          ? "bg-indigo-600/20 border-indigo-500 text-white"
          : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
      }`;
    }
    // After confirm
    const isThisCorrect = isCorrectAnswer(
      { type: isMulti ? "MULTIPLE_CHOICE" : "SINGLE_CHOICE", answer: correctAnswerRaw },
      optionStr,
      parsedOptions
    );

    if (isMulti) {
      const selected = Array.isArray(userAnswers[currentQ.id])
        ? (userAnswers[currentQ.id] as string[])
        : [];
      const isThisSelected = selected.some((s) =>
        isCorrectAnswer({ type: "SINGLE_CHOICE", answer: s }, optionStr, parsedOptions)
      );
      if (isThisCorrect) return `${base} bg-emerald-600/20 border-emerald-500 text-emerald-200`;
      if (isThisSelected && !isThisCorrect)
        return `${base} bg-red-600/20 border-red-500 text-red-200`;
      return `${base} bg-slate-950/60 border-slate-800 text-slate-500`;
    }
    // single
    const userStr = typeof userAnswers[currentQ.id] === "string"
      ? (userAnswers[currentQ.id] as string)
      : "";
    const isThisSelected = isCorrectAnswer(
      { type: "SINGLE_CHOICE", answer: userStr },
      optionStr,
      parsedOptions
    );
    if (isThisCorrect) return `${base} bg-emerald-600/20 border-emerald-500 text-emerald-200`;
    if (isThisSelected && !isThisCorrect)
      return `${base} bg-red-600/20 border-red-500 text-red-200`;
    return `${base} bg-slate-950/60 border-slate-800 text-slate-500`;
  };

  const renderOptionIcon = (optionStr: string) => {
    if (!isConfirmed) {
      if (isMulti) {
        const selected =
          Array.isArray(userAnswers[currentQ.id]) &&
          (userAnswers[currentQ.id] as string[]).includes(optionStr);
        return selected ? (
          <Check className="w-4 h-4 text-indigo-400 shrink-0" />
        ) : (
          <Square className="w-4 h-4 text-slate-600 shrink-0" />
        );
      }
      return null;
    }
    const isThisCorrect = isCorrectAnswer(
      { type: isMulti ? "MULTIPLE_CHOICE" : "SINGLE_CHOICE", answer: correctAnswerRaw },
      optionStr,
      parsedOptions
    );
    if (isThisCorrect) return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
    const userStr =
      typeof userAnswers[currentQ.id] === "string"
        ? (userAnswers[currentQ.id] as string)
        : (Array.isArray(userAnswers[currentQ.id])
            ? (userAnswers[currentQ.id] as string[])
            : []);
    const isThisSelected = Array.isArray(userStr)
      ? userStr.some((s) => isCorrectAnswer({ type: "SINGLE_CHOICE", answer: s }, optionStr, parsedOptions))
      : isCorrectAnswer({ type: "SINGLE_CHOICE", answer: userStr }, optionStr, parsedOptions);
    if (isThisSelected && !isThisCorrect)
      return <XCircle className="w-5 h-5 text-red-400 shrink-0" />;
    return null;
  };

  if (totalQuestions === 0) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 text-center">
        <BookOpen className="w-12 h-12 text-indigo-400 mb-3" />
        <h2 className="text-xl font-bold">Chưa có câu hỏi trong mã đề này</h2>
        <Link href={`/sets/${setInfo.code}`} className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition-colors">
          Quay lại mã đề
        </Link>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);
  const masteredCount = Object.values(masteredIds).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link
          href={`/sets/${setInfo.code}`}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Thoát bài học</span>
        </Link>

        <div className="text-center">
          <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md mr-2">
            {setInfo.code}
          </span>
          <span className="text-xs sm:text-sm font-semibold text-slate-200 hidden sm:inline">
            {setInfo.title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/sets/${setInfo.code}/quiz`}
            className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-colors text-xs font-semibold flex items-center gap-1.5"
          >
            <Award className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Thi trắc nghiệm</span>
          </Link>
          <button type="button" onClick={resetProgress} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" title="Học lại từ đầu">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Progress bar */}
      <div className="px-4 sm:px-8 pt-4 max-w-3xl mx-auto w-full space-y-2">
        <div className="flex justify-between text-xs font-semibold text-slate-400">
          <span>Câu {currentIndex + 1} / {totalQuestions}</span>
          <span>Đã thuộc: {masteredCount} câu</span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 transition-all duration-300 rounded-full" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 space-y-5">

        {/* ── FLASHCARD mode ─────────────────────────────────────────────── */}
        {isFlashcard && (
          <>
            <div
              onClick={() => setIsFlipped((p) => !p)}
              className="w-full min-h-[340px] sm:min-h-[400px] cursor-pointer group"
            >
              <div className={`w-full h-full rounded-3xl p-6 sm:p-8 border shadow-2xl flex flex-col justify-between transition-colors ${
                isFlipped
                  ? "bg-slate-900 border-indigo-500/50"
                  : "bg-slate-900/90 border-slate-800 hover:border-slate-700"
              }`}>
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <span>{isFlipped ? "Mặt sau: Đáp án" : "Mặt trước: Câu hỏi"}</span>
                  <span className="flex items-center gap-1 text-slate-500 group-hover:text-indigo-400 transition-colors">
                    <RotateCw className="w-3.5 h-3.5" />
                    Click / Space để lật
                  </span>
                </div>

                <div className="my-auto py-4 text-center space-y-4">
                  {!isFlipped ? (
                    <h3 className="text-xl sm:text-2xl font-bold text-white leading-relaxed">
                      {formatOptionText(currentQ.question)}
                    </h3>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-xl sm:text-2xl font-bold text-emerald-400 leading-relaxed">
                        {formatOptionText(currentQ.answer)}
                      </div>
                      {currentQ.explanation && (
                        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs sm:text-sm text-slate-300 italic text-left max-w-md mx-auto">
                          <strong>Giải thích:</strong> {formatOptionText(currentQ.explanation)}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setMasteredIds((p) => ({ ...p, [currentQ.id]: !p[currentQ.id] })); }}
                    className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      isMastered
                        ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                        : "bg-slate-800 border border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 ${isMastered ? "text-emerald-400" : ""}`} />
                    {isMastered ? "Đã thuộc câu này" : "Đánh dấu đã thuộc"}
                  </button>
                </div>
              </div>
            </div>

            {/* Flashcard nav */}
            <div className="flex items-center justify-between gap-4">
              <button type="button" onClick={handlePrev} disabled={currentIndex === 0}
                className="flex-1 py-3 px-4 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-30 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2">
                <ChevronLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Câu trước</span>
              </button>
              <button type="button" onClick={() => setIsFlipped((p) => !p)}
                className="py-3 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-indigo-600/30 flex items-center gap-2">
                <RotateCw className="w-4 h-4" />
                Lật thẻ
              </button>
              <button type="button" onClick={handleNext} disabled={currentIndex === totalQuestions - 1}
                className="flex-1 py-3 px-4 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-30 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2">
                <span className="hidden sm:inline">Câu tiếp</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </>
        )}

        {/* ── CHOICE mode (SINGLE or MULTI) ─────────────────────────────── */}
        {!isFlashcard && (
          <>
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
              {/* Type badge */}
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md">
                {isMulti ? "Chọn nhiều đáp án đúng – Bấm Xác nhận sau khi chọn" : "Chọn 1 đáp án đúng"}
              </span>

              {/* Question text – plain, NOT clickable */}
              <h3 className="text-xl sm:text-2xl font-bold text-white leading-relaxed">
                {formatOptionText(currentQ.question)}
              </h3>

              {/* Options */}
              <div className="space-y-2.5">
                {parsedOptions.map((opt, idx) => {
                  const optionStr = formatOptionText(opt);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectOption(optionStr)}
                      disabled={isConfirmed}
                      className={getOptionClass(optionStr)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {isMulti && !isConfirmed && (
                          <span className="shrink-0 w-5 h-5 rounded border border-slate-600 flex items-center justify-center bg-slate-900">
                            {Array.isArray(userAnswers[currentQ.id]) &&
                            (userAnswers[currentQ.id] as string[]).includes(optionStr) ? (
                              <Check className="w-3.5 h-3.5 text-indigo-400" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-slate-600" />
                            )}
                          </span>
                        )}
                        <span className="font-mono text-xs font-bold text-slate-400 shrink-0 w-5">
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        <span className="flex-1">{optionStr}</span>
                      </div>
                      {renderOptionIcon(optionStr)}
                    </button>
                  );
                })}
              </div>

              {/* Confirm button for MULTI */}
              {isMulti && !isConfirmed && (
                <button
                  type="button"
                  onClick={handleConfirmMulti}
                  disabled={
                    !Array.isArray(userAnswers[currentQ.id]) ||
                    (userAnswers[currentQ.id] as string[]).length === 0
                  }
                  className="w-full py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <BookOpenCheck className="w-4 h-4" />
                  Xác nhận đáp án đã chọn
                </button>
              )}

              {/* Result badge */}
              {isConfirmed && (
                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold ${
                  isCurrentCorrect
                    ? "bg-emerald-600/10 border-emerald-500/40 text-emerald-300"
                    : "bg-red-600/10 border-red-500/40 text-red-300"
                }`}>
                  {isCurrentCorrect ? (
                    <><CheckCircle2 className="w-5 h-5" /> Chính xác! Câu trả lời đúng</>
                  ) : (
                    <><XCircle className="w-5 h-5" /> Chưa đúng – Đáp án: <strong className="ml-1">{correctAnswerRaw}</strong></>
                  )}
                </div>
              )}

              {/* Explanation */}
              {isConfirmed && currentQ.explanation && (
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-700 text-xs sm:text-sm text-slate-300 italic">
                  <strong className="text-white not-italic">Giải thích: </strong>
                  {formatOptionText(currentQ.explanation)}
                </div>
              )}
            </div>

            {/* Choice nav */}
            <div className="flex items-center justify-between gap-4">
              <button type="button" onClick={handlePrev} disabled={currentIndex === 0}
                className="py-3 px-5 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-30 text-white font-semibold text-sm transition-colors">
                Câu trước
              </button>
              <button type="button" onClick={handleNext} disabled={currentIndex === totalQuestions - 1}
                className="py-3 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white font-semibold text-sm transition-colors shadow-lg shadow-indigo-600/30">
                Câu tiếp theo
              </button>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-3 text-center text-xs text-slate-500">
        <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300 font-mono text-[10px]">←</kbd>{" "}
        /{" "}
        <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300 font-mono text-[10px]">→</kbd>{" "}
        Chuyển câu
        {" "}•{" "}
        <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300 font-mono text-[10px]">Space</kbd>{" "}
        Lật thẻ (chỉ Flashcard)
      </footer>
    </div>
  );
}
