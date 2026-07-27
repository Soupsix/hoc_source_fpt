"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatOptionText, parseOptionsArray } from "@/lib/utils";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Award,
  Check,
  Square,
  BookOpen,
  BookOpenCheck,
} from "lucide-react";

interface QuestionItem {
  id: string;
  type: "FLASHCARD" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
  question: string;
  answer: string;
  options?: unknown;
  explanation: string | null;
}

interface QuizAppProps {
  setInfo: {
    code: string;
    title: string;
  };
  questions: QuestionItem[];
}

// Normalise an answer string/letter to the display text of one of the options.
// If the answer is a single letter like "A" or "B" it maps to the corresponding
// option string. Otherwise the raw answer string is used as-is for comparison.
function resolveAnswer(raw: string, options: string[]): string {
  const trimmed = raw.trim();
  if (trimmed.length === 1) {
    const idx = trimmed.toUpperCase().charCodeAt(0) - 65; // A→0, B→1 …
    if (idx >= 0 && idx < options.length) {
      return formatOptionText(options[idx]);
    }
  }
  return trimmed;
}

function isCorrect(
  q: QuestionItem,
  userAns: string | string[] | undefined,
  options: string[]
): boolean {
  if (userAns === undefined) return false;

  if (q.type === "MULTIPLE_CHOICE") {
    // Answer stored as "A, B" or "Đáp án A, Đáp án B" etc.
    const rawParts = formatOptionText(q.answer)
      .split(",")
      .map((s) => s.trim());
    const correctTexts = rawParts.map((part) =>
      resolveAnswer(part, options).toLowerCase()
    );
    const userTexts = (Array.isArray(userAns) ? userAns : [userAns]).map(
      (s) => s.trim().toLowerCase()
    );
    return (
      correctTexts.length === userTexts.length &&
      correctTexts.every((c) => userTexts.includes(c))
    );
  }

  // SINGLE_CHOICE or FLASHCARD
  const correctText = resolveAnswer(
    formatOptionText(q.answer),
    options
  ).toLowerCase();
  const userText =
    typeof userAns === "string" ? userAns.trim().toLowerCase() : "";
  return correctText === userText;
}

export function QuizApp({ setInfo, questions }: QuizAppProps) {
  const [activeQuestions, setActiveQuestions] =
    useState<QuestionItem[]>(questions);
  const [currentIndex, setCurrentIndex] = useState(0);
  // userAnswers: id → string (single) | string[] (multi)
  const [userAnswers, setUserAnswers] = useState<
    Record<string, string | string[]>
  >({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  // Per-question: whether user has confirmed their answer
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());

  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (isSubmitted || activeQuestions.length === 0) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isSubmitted, activeQuestions.length]);

  if (activeQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 text-center">
        <BookOpen className="w-12 h-12 text-indigo-400 mb-3" />
        <h2 className="text-xl font-bold">Chưa có câu hỏi trong mã đề này</h2>
        <p className="text-slate-400 text-sm mt-1 max-w-sm">
          Vui lòng quay lại thư viện mã đề để chọn bộ câu hỏi khác.
        </p>
        <Link
          href={`/sets/${setInfo.code}`}
          className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition-colors"
        >
          Quay lại mã đề
        </Link>
      </div>
    );
  }

  const currentQ = activeQuestions[currentIndex];
  const parsedOptions = parseOptionsArray(currentQ.options);
  const isCurrentConfirmed = confirmedIds.has(currentQ.id);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const handleSelectOption = (value: string) => {
    if (isSubmitted || isCurrentConfirmed) return;

    if (currentQ.type === "MULTIPLE_CHOICE") {
      const prev = Array.isArray(userAnswers[currentQ.id])
        ? (userAnswers[currentQ.id] as string[])
        : [];
      const updated = prev.includes(value)
        ? prev.filter((x) => x !== value)
        : [...prev, value];
      setUserAnswers((a) => ({ ...a, [currentQ.id]: updated }));
    } else {
      // SINGLE_CHOICE – selecting auto-confirms
      setUserAnswers((a) => ({ ...a, [currentQ.id]: value }));
      setConfirmedIds((s) => new Set([...s, currentQ.id]));
    }
  };

  const handleConfirmMulti = () => {
    if (
      !Array.isArray(userAnswers[currentQ.id]) ||
      (userAnswers[currentQ.id] as string[]).length === 0
    )
      return;
    setConfirmedIds((s) => new Set([...s, currentQ.id]));
  };

  const handleShuffle = () => {
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    setActiveQuestions(shuffled);
    setCurrentIndex(0);
    setUserAnswers({});
    setConfirmedIds(new Set());
    setIsSubmitted(false);
    setElapsedSeconds(0);
  };

  const handleSubmitQuiz = () => {
    setIsSubmitted(true);
  };

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  // ── Score ─────────────────────────────────────────────────────────────────

  const correctCount = activeQuestions.filter((q) =>
    isCorrect(q, userAnswers[q.id], parseOptionsArray(q.options))
  ).length;
  const accuracy = Math.round((correctCount / activeQuestions.length) * 100);

  // ── Render single question ────────────────────────────────────────────────

  const renderAnswerFeedback = (optionStr: string) => {
    if (!isCurrentConfirmed) return null;

    const qOptions = parsedOptions;
    const correctResolved = formatOptionText(currentQ.answer)
      .split(",")
      .map((p) => resolveAnswer(p.trim(), qOptions).toLowerCase());

    const isThisCorrect = correctResolved.includes(optionStr.toLowerCase());

    if (currentQ.type === "MULTIPLE_CHOICE") {
      const selected = Array.isArray(userAnswers[currentQ.id])
        ? (userAnswers[currentQ.id] as string[]).map((s) => s.toLowerCase())
        : [];
      const isThisSelected = selected.includes(optionStr.toLowerCase());

      if (isThisCorrect && isThisSelected)
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
      if (isThisCorrect && !isThisSelected)
        return <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />;
      if (!isThisCorrect && isThisSelected)
        return <XCircle className="w-5 h-5 text-red-400 shrink-0" />;
      return null;
    }

    // SINGLE_CHOICE
    const userSelected =
      typeof userAnswers[currentQ.id] === "string"
        ? (userAnswers[currentQ.id] as string).toLowerCase()
        : "";
    const isThisSelected = userSelected === optionStr.toLowerCase();

    if (isThisCorrect) return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
    if (isThisSelected && !isThisCorrect) return <XCircle className="w-5 h-5 text-red-400 shrink-0" />;
    return null;
  };

  const getOptionClass = (optionStr: string) => {
    const base =
      "w-full p-4 rounded-2xl border text-left text-sm sm:text-base transition-all flex items-center justify-between gap-3";

    if (!isCurrentConfirmed) {
      const isSelected =
        currentQ.type === "MULTIPLE_CHOICE"
          ? Array.isArray(userAnswers[currentQ.id]) &&
            (userAnswers[currentQ.id] as string[]).includes(optionStr)
          : userAnswers[currentQ.id] === optionStr;
      return `${base} ${
        isSelected
          ? "bg-indigo-600/20 border-indigo-500 text-white"
          : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
      }`;
    }

    // After confirmation – colour-code
    const qOptions = parsedOptions;
    const correctResolved = formatOptionText(currentQ.answer)
      .split(",")
      .map((p) => resolveAnswer(p.trim(), qOptions).toLowerCase());
    const isThisCorrect = correctResolved.includes(optionStr.toLowerCase());

    if (currentQ.type === "MULTIPLE_CHOICE") {
      const selected = Array.isArray(userAnswers[currentQ.id])
        ? (userAnswers[currentQ.id] as string[]).map((s) => s.toLowerCase())
        : [];
      const isThisSelected = selected.includes(optionStr.toLowerCase());

      if (isThisCorrect)
        return `${base} bg-emerald-600/20 border-emerald-500 text-emerald-200`;
      if (isThisSelected && !isThisCorrect)
        return `${base} bg-red-600/20 border-red-500 text-red-200`;
      return `${base} bg-slate-950/60 border-slate-800 text-slate-500`;
    }

    // SINGLE
    const userSelected =
      typeof userAnswers[currentQ.id] === "string"
        ? (userAnswers[currentQ.id] as string).toLowerCase()
        : "";
    if (isThisCorrect)
      return `${base} bg-emerald-600/20 border-emerald-500 text-emerald-200`;
    if (userSelected === optionStr.toLowerCase() && !isThisCorrect)
      return `${base} bg-red-600/20 border-red-500 text-red-200`;
    return `${base} bg-slate-950/60 border-slate-800 text-slate-500`;
  };

  // ── Main Render ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link
          href={`/sets/${setInfo.code}`}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Thoát bài thi</span>
        </Link>

        <div className="text-center">
          <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md mr-2">
            {setInfo.code}
          </span>
          <span className="text-xs sm:text-sm font-semibold text-slate-200 truncate max-w-xs inline-block align-bottom">
            Kiểm tra trắc nghiệm
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-mono bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-amber-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>
          <button
            type="button"
            onClick={handleShuffle}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Trộn câu hỏi"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Quiz Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 my-auto">
        {!isSubmitted ? (
          <div className="space-y-6">
            {/* Progress */}
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span>
                Câu {currentIndex + 1} / {activeQuestions.length}
              </span>
              <span>
                Đã trả lời: {confirmedIds.size} / {activeQuestions.length}
              </span>
            </div>

            {/* Question Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
              {/* Type label */}
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md">
                {currentQ.type === "SINGLE_CHOICE"
                  ? "Chọn 1 đáp án đúng"
                  : currentQ.type === "MULTIPLE_CHOICE"
                  ? "Chọn nhiều đáp án đúng – Bấm Xác nhận sau khi chọn"
                  : "Flashcard"}
              </span>

              {/* Question text – NOT clickable */}
              <h3 className="text-xl sm:text-2xl font-bold text-white leading-relaxed">
                {formatOptionText(currentQ.question)}
              </h3>

              {/* Options */}
              {parsedOptions.length > 0 ? (
                <div className="space-y-2.5">
                  {parsedOptions.map((opt, idx) => {
                    const optionStr = formatOptionText(opt);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectOption(optionStr)}
                        disabled={isCurrentConfirmed}
                        className={getOptionClass(optionStr)}
                      >
                        <div className="flex items-center gap-3">
                          {/* Checkbox-style indicator for MULTIPLE_CHOICE */}
                          {currentQ.type === "MULTIPLE_CHOICE" &&
                            !isCurrentConfirmed && (
                              <span className="shrink-0 w-5 h-5 rounded border border-slate-600 flex items-center justify-center bg-slate-900">
                                {Array.isArray(userAnswers[currentQ.id]) &&
                                (userAnswers[currentQ.id] as string[]).includes(
                                  optionStr
                                ) ? (
                                  <Check className="w-3.5 h-3.5 text-indigo-400" />
                                ) : (
                                  <Square className="w-3.5 h-3.5 text-slate-600" />
                                )}
                              </span>
                            )}
                          <span className="font-mono text-xs font-bold text-slate-400 w-5 shrink-0">
                            {String.fromCharCode(65 + idx)}.
                          </span>
                          <span className="flex-1">{optionStr}</span>
                        </div>
                        {renderAnswerFeedback(optionStr)}
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Flashcard text input */
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-400 uppercase">
                    Nhập đáp án của bạn:
                  </label>
                  <input
                    type="text"
                    placeholder="Gõ đáp án vào đây..."
                    value={(userAnswers[currentQ.id] as string) || ""}
                    onChange={(e) =>
                      setUserAnswers((prev) => ({
                        ...prev,
                        [currentQ.id]: e.target.value,
                      }))
                    }
                    className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Confirm button for MULTIPLE_CHOICE */}
              {currentQ.type === "MULTIPLE_CHOICE" && !isCurrentConfirmed && (
                <button
                  type="button"
                  onClick={handleConfirmMulti}
                  disabled={
                    !Array.isArray(userAnswers[currentQ.id]) ||
                    (userAnswers[currentQ.id] as string[]).length === 0
                  }
                  className="mt-2 w-full py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <BookOpenCheck className="w-4 h-4" />
                  Xác nhận đáp án đã chọn
                </button>
              )}

              {/* Explanation revealed after confirm */}
              {isCurrentConfirmed && currentQ.explanation && (
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-700 text-xs sm:text-sm text-slate-300 italic">
                  <strong className="text-white not-italic">Giải thích: </strong>
                  {formatOptionText(currentQ.explanation)}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
                disabled={currentIndex === 0}
                className="py-3 px-5 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-30 text-white font-semibold text-sm transition-colors"
              >
                Câu trước
              </button>

              {currentIndex < activeQuestions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((p) => p + 1)}
                  className="py-3 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-indigo-600/30"
                >
                  Câu tiếp theo
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  className="py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors shadow-lg shadow-emerald-600/30"
                >
                  Nộp bài làm
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ── Results View ─────────────────────────────────────────────── */
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-white">
                  Kết quả bài thi
                </h2>
                <p className="text-slate-400 text-xs sm:text-sm mt-1">
                  Thời gian hoàn thành: {formatTimer(elapsedSeconds)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto pt-2">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <p className="text-xs text-slate-500 uppercase font-semibold">
                    Số câu đúng
                  </p>
                  <p className="text-2xl font-bold text-emerald-400">
                    {correctCount} / {activeQuestions.length}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <p className="text-xs text-slate-500 uppercase font-semibold">
                    Tỷ lệ chính xác
                  </p>
                  <p className="text-2xl font-bold text-indigo-400">
                    {accuracy}%
                  </p>
                </div>
              </div>
              <div className="pt-4 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={handleShuffle}
                  className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm transition-colors"
                >
                  Làm lại bài thi
                </button>
                <Link
                  href={`/sets/${setInfo.code}`}
                  className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-sm transition-colors"
                >
                  Quay lại mã đề
                </Link>
              </div>
            </div>

            {/* Detailed review */}
            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-bold text-white">
                Xem lại bài làm chi tiết
              </h3>
              <div className="space-y-3">
                {activeQuestions.map((q, idx) => {
                  const qOptions = parseOptionsArray(q.options);
                  const right = isCorrect(q, userAnswers[q.id], qOptions);
                  const uAns = userAnswers[q.id];
                  const answerDisplay = Array.isArray(uAns)
                    ? uAns.join(", ")
                    : uAns || "(Bỏ trống)";

                  return (
                    <div
                      key={q.id}
                      className={`p-5 rounded-2xl border space-y-2 ${
                        right
                          ? "bg-slate-900/60 border-emerald-500/40"
                          : "bg-slate-900/60 border-red-500/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-slate-400">
                          Câu {idx + 1}
                        </span>
                        {right ? (
                          <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Chính xác
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-red-400 flex items-center gap-1">
                            <XCircle className="w-4 h-4" /> Chưa đúng
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-white text-sm sm:text-base">
                        {formatOptionText(q.question)}
                      </p>
                      <div className="text-xs space-y-1 pt-1">
                        <p className="text-slate-400">
                          Đã chọn:{" "}
                          <span
                            className={
                              right
                                ? "text-emerald-300 font-semibold"
                                : "text-red-300 font-semibold"
                            }
                          >
                            {answerDisplay}
                          </span>
                        </p>
                        <p className="text-emerald-400">
                          Đáp án đúng:{" "}
                          <strong>{formatOptionText(q.answer)}</strong>
                        </p>
                      </div>
                      {q.explanation && (
                        <p className="text-xs text-slate-400 italic bg-slate-950 p-2.5 rounded-xl border border-slate-800 mt-2">
                          Giải thích: {formatOptionText(q.explanation)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
