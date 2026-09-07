"use client";

import React, { useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Flag, ChevronLeft, ChevronRight, Clock, CheckCircle2,
  AlertTriangle, Send, BookOpen, Wifi, WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SnapshotQuestion {
  order: number;
  examQuestionId: string;
  questionId: string;
  type: string;
  content: string;
  points: number;
  options: { id: string; label: string; content: string }[];
}

interface AttemptData {
  attemptId: string;
  examId: string;
  title: string;
  durationMinutes: number;
  startedAt: string;
  expiresAt: string;
  antiCheatLevel: number;
  snapshot: SnapshotQuestion[];
}

interface Answers {
  [questionId: string]: {
    selectedOptionIds?: string[];
    textAnswer?: string;
    isFlagged?: boolean;
  };
}

function renderImportedContent(content: string, keyPrefix: string): ReactNode {
  const parts = content.split(/(!\[[^\]]*\]\(data:image\/[\w.+-]+;base64,[^)]+\))/g);
  return parts.map((part, index) => {
    const match = part.match(/^!\[([^\]]*)\]\((data:image\/[\w.+-]+;base64,[^)]+)\)$/);
    if (!match) return <React.Fragment key={`${keyPrefix}-${index}`}>{part}</React.Fragment>;
    return (
      <img
        key={`${keyPrefix}-${index}`}
        src={match[2]}
        alt={match[1] || "Hình ảnh câu hỏi"}
        className="my-3 max-h-64 max-w-full rounded-lg object-contain"
      />
    );
  });
}

export default function ExamRoomPage() {
  const router = useRouter();
  const attemptDataRef = useRef<AttemptData | null>(null);

  const [loaded, setLoaded] = useState(false);
  const [attemptData, setAttemptData] = useState<AttemptData | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ score: number | null; showScore: boolean } | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [cheatFlags, setCheatFlags] = useState<string[]>([]);
  const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load attempt from localStorage (set by join page)
  useEffect(() => {
    const raw = sessionStorage.getItem("exam_attempt");
    if (!raw) {
      router.replace("/exam/join");
      return;
    }
    try {
      const data: AttemptData = JSON.parse(raw);
      attemptDataRef.current = data;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAttemptData(data);
      const remaining = Math.max(0, Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000));
      setTimeLeft(remaining);
      setLoaded(true);
    } catch {
      router.replace("/exam/join");
    }
  }, [router]);

  // Online/offline detection
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); };
  }, []);

  // Anti-cheat: detect tab switch / visibility change
  useEffect(() => {
    if (!attemptData || attemptData.antiCheatLevel === 0) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const flag = `TAB_SWITCH:${new Date().toISOString()}`;
        setCheatFlags(prev => [...prev, flag]);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [attemptData]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Debounced autosave
  const autosave = useCallback(async (questionId: string, answerData: Answers[string]) => {
    const data = attemptDataRef.current;
    if (!data) return;

    try {
      const response = await fetch("/api/exam-session/autosave", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: data.attemptId,
          questionId,
          selectedOptionIds: answerData.selectedOptionIds?.join(",") || undefined,
          textAnswer: answerData.textAnswer,
          isFlagged: answerData.isFlagged,
        }),
      });
      if (response.ok) setLastSaved(new Date());
    } catch {
      // Silent fail, will retry on next change
    }
  }, []);

  const handleOptionSelect = (questionId: string, optionId: string, type: string) => {
    setAnswers(prev => {
      const existing = prev[questionId]?.selectedOptionIds || [];
      let newSelected: string[];

      if (type === "multiple_choice") {
        if (existing.includes(optionId)) {
          newSelected = existing.filter(id => id !== optionId);
        } else {
          newSelected = [...existing, optionId];
        }
      } else {
        newSelected = [optionId];
      }

      const updated = { ...prev, [questionId]: { ...prev[questionId], selectedOptionIds: newSelected } };

      // Debounce autosave
      if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
      autosaveTimeoutRef.current = setTimeout(() => {
        autosave(questionId, updated[questionId]);
      }, 800);

      return updated;
    });
  };

  const handleTextAnswer = (questionId: string, text: string) => {
    setAnswers(prev => {
      const updated = { ...prev, [questionId]: { ...prev[questionId], textAnswer: text } };
      if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
      autosaveTimeoutRef.current = setTimeout(() => autosave(questionId, updated[questionId]), 1500);
      return updated;
    });
  };

  const toggleFlag = (questionId: string) => {
    setAnswers(prev => {
      const updated = { ...prev, [questionId]: { ...prev[questionId], isFlagged: !prev[questionId]?.isFlagged } };
      autosave(questionId, updated[questionId]);
      return updated;
    });
  };

  const handleSubmit = async (autoSubmit = false) => {
    const data = attemptDataRef.current;
    if (!data || isSubmitting || isSubmitted) return;

    if (!autoSubmit) {
      const answeredCount = Object.keys(answers).filter(qId => {
        const a = answers[qId];
        return (a.selectedOptionIds && a.selectedOptionIds.length > 0) || (a.textAnswer && a.textAnswer.trim());
      }).length;
      const total = data.snapshot.length;

      if (answeredCount < total) {
        const confirmed = window.confirm(
          `Bạn chưa trả lời ${total - answeredCount}/${total} câu. Bạn có chắc muốn nộp bài?`
        );
        if (!confirmed) return;
      }
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/exam-session/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: data.attemptId, cheatFlags }),
      });
      const result = await res.json();

      if (res.ok) {
        setIsSubmitted(true);
        sessionStorage.removeItem("exam_attempt");
        setSubmitResult({ score: result.score, showScore: result.showScore });
        // Redirect to result page after 2s
        setTimeout(() => {
          router.replace(`/exam/result/${data.attemptId}`);
        }, 2000);
      } else if (res.status === 408) {
        setIsSubmitted(true);
        sessionStorage.removeItem("exam_attempt");
        router.replace(`/exam/result/${data.attemptId}`);
      } else {
        alert(result.error || "Lỗi nộp bài");
        setIsSubmitting(false);
      }
    } catch {
      alert("Lỗi kết nối khi nộp bài. Vui lòng thử lại.");
      setIsSubmitting(false);
    }
  };

  // Countdown timer
  useEffect(() => {
    if (!loaded || timeLeft <= 0 || isSubmitted) return;

    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(interval);
          handleSubmit(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loaded, isSubmitted]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!loaded || !attemptData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center text-white">
          <div className="h-10 w-10 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Đang tải đề thi...</p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center text-white p-8 bg-white/10 backdrop-blur rounded-2xl shadow-xl max-w-sm w-full">
          <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Đã nộp bài!</h2>
          {submitResult?.showScore && submitResult.score !== null && (
            <div className="text-4xl font-black text-green-400 my-4">{submitResult.score.toFixed(1)}/10</div>
          )}
          <p className="text-slate-300">Đang chuyển đến trang kết quả...</p>
        </div>
      </div>
    );
  }

  const question = attemptData.snapshot[currentQ];
  const answer = answers[question?.questionId] || {};
  const answeredCount = attemptData.snapshot.filter(q => {
    const a = answers[q.questionId];
    return (a?.selectedOptionIds && a.selectedOptionIds.length > 0) || (a?.textAnswer && a.textAnswer.trim());
  }).length;

  const timeWarning = timeLeft <= 300; // 5 minutes
  const timeCritical = timeLeft <= 60; // 1 minute

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className={cn(
        "sticky top-0 z-30 px-4 py-3 flex items-center justify-between border-b",
        timeCritical ? "bg-red-900 border-red-800" : timeWarning ? "bg-amber-900 border-amber-800" : "bg-slate-800 border-slate-700"
      )}>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">{attemptData.title}</p>
            <p className="text-slate-400 text-xs mt-0.5">{answeredCount}/{attemptData.snapshot.length} câu đã trả lời</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Online indicator */}
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-400" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-400 animate-pulse" />
          )}
          {lastSaved && (
            <span className="text-slate-400 text-xs hidden md:block">
              Đã lưu {lastSaved.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}

          {/* Timer */}
          <div className={cn(
            "flex items-center gap-2 font-mono text-lg font-bold px-4 py-2 rounded-xl",
            timeCritical ? "bg-red-600 text-white animate-pulse" :
              timeWarning ? "bg-amber-600 text-white" : "bg-slate-700 text-white"
          )}>
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>

          {/* Submit button */}
          <button
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? "Đang nộp..." : "Nộp bài"}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Question Navigation Sidebar */}
        <div className="w-52 shrink-0 bg-slate-800 border-r border-slate-700 p-3 overflow-y-auto hidden md:block">
          <p className="text-slate-400 text-xs font-semibold uppercase mb-3 px-1">Danh sách câu hỏi</p>
          <div className="grid grid-cols-4 gap-1.5">
            {attemptData.snapshot.map((q, idx) => {
              const a = answers[q.questionId];
              const isAnswered = (a?.selectedOptionIds && a.selectedOptionIds.length > 0) || (a?.textAnswer && a.textAnswer.trim());
              const isFlagged = a?.isFlagged;
              return (
                <button
                  key={q.questionId}
                  onClick={() => setCurrentQ(idx)}
                  className={cn(
                    "h-9 w-full rounded-lg text-xs font-bold transition-all relative",
                    idx === currentQ ? "bg-blue-600 text-white ring-2 ring-blue-400" :
                      isFlagged ? "bg-amber-500/20 text-amber-400 border border-amber-500" :
                        isAnswered ? "bg-green-500/20 text-green-400 border border-green-600" :
                          "bg-slate-700 text-slate-400 hover:bg-slate-600"
                  )}
                >
                  {idx + 1}
                  {isFlagged && <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-amber-500 rounded-full" />}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 space-y-1.5 text-xs">
            {[
              { color: "bg-green-500/20 border-green-600", label: "Đã trả lời" },
              { color: "bg-amber-500/20 border-amber-500", label: "Đánh dấu" },
              { color: "bg-slate-700", label: "Chưa làm" },
              { color: "bg-blue-600", label: "Câu hiện tại" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2 text-slate-500">
                <div className={cn("h-4 w-4 rounded border", color)} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Question Display */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {question && (
            <div className="max-w-3xl mx-auto">
              {/* Question header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-lg">
                    Câu {question.order}
                  </span>
                  <span className="text-slate-400 text-sm">{question.points} điểm</span>
                  <span className="text-slate-500 text-xs bg-slate-800 px-2 py-1 rounded-lg capitalize">
                    {question.type.replace("_", " ")}
                  </span>
                </div>
                <button
                  onClick={() => toggleFlag(question.questionId)}
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors",
                    answer.isFlagged ? "bg-amber-500/20 text-amber-400 border border-amber-500" : "text-slate-500 hover:text-amber-400 hover:bg-slate-800"
                  )}
                >
                  <Flag className="h-3.5 w-3.5" />
                  {answer.isFlagged ? "Đã đánh dấu" : "Đánh dấu"}
                </button>
              </div>

              {/* Question content */}
              <div className="bg-slate-800 rounded-2xl p-5 mb-4 border border-slate-700">
                <div className="text-white text-base leading-relaxed whitespace-pre-wrap">
                  {renderImportedContent(question.content, `question-${question.questionId}`)}
                </div>
              </div>

              {/* Options / Answer Input */}
              {(question.type === "single_choice" || question.type === "true_false" || question.type === "multiple_choice") && (
                <div className="space-y-2.5">
                  {question.type === "multiple_choice" && (
                    <p className="text-slate-400 text-xs mb-3 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                      Có thể chọn nhiều đáp án đúng
                    </p>
                  )}
                  {question.options.map(option => {
                    const isSelected = answer.selectedOptionIds?.includes(option.id);
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleOptionSelect(question.questionId, option.id, question.type)}
                        className={cn(
                          "w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all",
                          isSelected
                            ? "bg-blue-600/20 border-blue-500 text-white"
                            : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-600"
                        )}
                      >
                        <span className={cn(
                          "h-6 w-6 shrink-0 rounded-full border-2 flex items-center justify-center text-xs font-bold mt-0.5",
                          isSelected ? "bg-blue-600 border-blue-500 text-white" : "border-slate-600 text-slate-400"
                        )}>
                          {option.label}
                        </span>
                        <span className="text-sm leading-relaxed">{renderImportedContent(option.content, `option-${option.id}`)}</span>
                        {isSelected && <CheckCircle2 className="h-5 w-5 text-blue-400 shrink-0 ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {(question.type === "short_answer" || question.type === "fill_blank") && (
                <div>
                  <p className="text-slate-400 text-sm mb-2">Điền câu trả lời vào ô bên dưới:</p>
                  <input
                    type="text"
                    value={answer.textAnswer || ""}
                    onChange={e => handleTextAnswer(question.questionId, e.target.value)}
                    placeholder="Nhập câu trả lời..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-500"
                  />
                </div>
              )}

              {question.type === "essay" && (
                <div>
                  <p className="text-slate-400 text-sm mb-2">Viết bài tự luận:</p>
                  <textarea
                    value={answer.textAnswer || ""}
                    onChange={e => handleTextAnswer(question.questionId, e.target.value)}
                    placeholder="Viết câu trả lời tự luận..."
                    rows={8}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-500 resize-none"
                  />
                  <p className="text-slate-500 text-xs mt-1">{(answer.textAnswer || "").length} ký tự</p>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700">
                <button
                  onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
                  disabled={currentQ === 0}
                  className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed px-4 py-2.5 rounded-xl hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Câu trước
                </button>

                <span className="text-slate-500 text-sm">
                  {currentQ + 1} / {attemptData.snapshot.length}
                </span>

                {currentQ < attemptData.snapshot.length - 1 ? (
                  <button
                    onClick={() => setCurrentQ(q => Math.min(attemptData.snapshot.length - 1, q + 1))}
                    className="flex items-center gap-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-xl transition-colors"
                  >
                    Câu tiếp
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubmit(false)}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    Nộp bài
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
