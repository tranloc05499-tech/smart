"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2, XCircle, Clock, BookOpen, Trophy, ArrowLeft,
  ChevronDown, ChevronUp, Flag, BarChart2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AnswerResult {
  order: number;
  questionId: string;
  type: string;
  content: string;
  points: number;
  options: { id: string; label: string; content: string }[];
  selectedOptionIds?: string;
  textAnswer?: string;
  score?: number;
  isCorrect?: boolean;
  isFlagged?: boolean;
  correctAnswer?: string;
  explanation?: string;
  correctOptionIds?: string[];
}

interface ExamResult {
  attemptId: string;
  studentName: string;
  studentCode?: string;
  status: string;
  score?: number;
  totalPoints?: number;
  startedAt: string;
  submittedAt?: string;
  durationUsedSeconds?: number;
  exam: {
    title: string;
    code: string;
    passScore: number;
    showScore: boolean;
    showAnswers: boolean;
    showExplanation: boolean;
  };
  answers?: AnswerResult[];
  questionsTotal: number;
  questionsAnswered: number;
  questionsCorrect: number;
}

export default function ExamResultPage() {
  const params = useParams<{ id: string }>();
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedAnswers, setExpandedAnswers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/exam-results/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); }
        else { setResult(data); }
      })
      .catch(() => setError("Lỗi tải kết quả"))
      .finally(() => setLoading(false));
  }, [params.id]);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m} phút ${s} giây`;
  };

  const toggleAnswer = (id: string) => {
    setExpandedAnswers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="h-10 w-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500">Đang tải kết quả...</p>
      </div>
    </div>
  );

  if (error || !result) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
        <p className="text-slate-700 font-medium">{error || "Không tìm thấy kết quả"}</p>
        <Link href="/exam/join" className="text-blue-600 text-sm hover:underline mt-3 inline-block">← Quay lại</Link>
      </div>
    </div>
  );

  const isPassed = result.score !== undefined && result.score >= result.exam.passScore;
  const accuracyPct = result.questionsTotal > 0
    ? Math.round((result.questionsCorrect / result.questionsTotal) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm">{result.exam.title}</p>
            <p className="text-slate-400 text-xs">Mã đề: {result.exam.code}</p>
          </div>
        </div>
        <Link href="/exam/join"
          className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Về trang chủ
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Score Card */}
        <div className={cn(
          "rounded-2xl p-8 text-center mb-6 shadow-sm border",
          isPassed
            ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
            : "bg-gradient-to-br from-red-50 to-orange-50 border-red-200"
        )}>
          {isPassed ? (
            <Trophy className="h-14 w-14 text-green-500 mx-auto mb-3" />
          ) : (
            <XCircle className="h-14 w-14 text-red-400 mx-auto mb-3" />
          )}

          <h1 className="text-2xl font-black text-slate-900 mb-1">
            {isPassed ? "🎉 Chúc mừng! Bạn đã vượt qua!" : "Tiếp tục cố gắng nhé!"}
          </h1>
          <p className="text-slate-500 text-sm">{result.studentName} • {result.studentCode || "Không có mã HS"}</p>

          {result.exam.showScore && result.score !== undefined && (
            <div className="mt-6">
              <div className={cn(
                "text-7xl font-black",
                isPassed ? "text-green-600" : "text-red-500"
              )}>
                {result.score.toFixed(1)}
              </div>
              <p className="text-slate-500 text-sm mt-1">/ 10 điểm • Ngưỡng đạt: {result.exam.passScore}</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/50">
            {[
              { label: "Câu đúng", value: `${result.questionsCorrect}/${result.questionsTotal}`, icon: CheckCircle2, color: "text-green-600" },
              { label: "Độ chính xác", value: `${accuracyPct}%`, icon: BarChart2, color: "text-blue-600" },
              { label: "Thời gian", value: formatDuration(result.durationUsedSeconds), icon: Clock, color: "text-slate-600" },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <stat.icon className={cn("h-5 w-5 mx-auto mb-1", stat.color)} />
                <div className="font-bold text-slate-800">{stat.value}</div>
                <div className="text-xs text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Answer Review */}
        {result.exam.showAnswers && result.answers && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Chi tiết bài làm</h2>

            {result.answers.map(ans => (
              <div
                key={ans.questionId}
                className={cn(
                  "bg-white rounded-xl border overflow-hidden shadow-xs",
                  ans.isCorrect === true ? "border-green-200" :
                    ans.isCorrect === false ? "border-red-200" : "border-slate-200"
                )}
              >
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50"
                  onClick={() => toggleAnswer(ans.questionId)}
                >
                  <div className="flex items-center gap-3">
                    {ans.isCorrect === true ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    ) : ans.isCorrect === false ? (
                      <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-slate-300 shrink-0" />
                    )}
                    <div>
                      <span className="text-xs font-bold text-slate-500 mr-2">Câu {ans.order}</span>
                      <span className="text-sm text-slate-800 line-clamp-1">{ans.content}</span>
                    </div>
                    {ans.isFlagged && <Flag className="h-4 w-4 text-amber-500 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-sm font-bold",
                      ans.isCorrect ? "text-green-600" : "text-red-500"
                    )}>
                      {ans.score?.toFixed(1) ?? "—"}/{ans.points}
                    </span>
                    {expandedAnswers.has(ans.questionId) ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {expandedAnswers.has(ans.questionId) && (
                  <div className="border-t border-slate-100 p-4 space-y-3 bg-slate-50/50">
                    {/* Question options */}
                    {ans.options.length > 0 && (
                      <div className="space-y-1.5">
                        {ans.options.map(opt => {
                          const isSelected = ans.selectedOptionIds?.split(",").includes(opt.id);
                          const isCorrectOpt = ans.correctOptionIds?.includes(opt.id);
                          return (
                            <div key={opt.id} className={cn(
                              "flex items-center gap-2.5 p-2.5 rounded-lg text-sm",
                              isCorrectOpt ? "bg-green-50 text-green-800 font-medium" :
                                isSelected && !isCorrectOpt ? "bg-red-50 text-red-800" : "text-slate-600"
                            )}>
                              <span className="h-6 w-6 shrink-0 rounded-full bg-white border flex items-center justify-center text-xs font-bold">
                                {opt.label}
                              </span>
                              <span>{opt.content}</span>
                              {isSelected && <span className="ml-auto text-xs">{isCorrectOpt ? "✓ Bạn chọn (đúng)" : "✗ Bạn chọn (sai)"}</span>}
                              {!isSelected && isCorrectOpt && <span className="ml-auto text-xs text-green-600">← Đáp án đúng</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Text answer */}
                    {ans.textAnswer && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1">Câu trả lời của bạn:</p>
                        <p className="text-sm text-slate-800 bg-white border rounded-lg px-3 py-2">{ans.textAnswer}</p>
                      </div>
                    )}

                    {/* Correct answer for text-based */}
                    {ans.correctAnswer && ans.type !== "essay" && (
                      <div>
                        <p className="text-xs font-semibold text-green-700 mb-1">Đáp án đúng:</p>
                        <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{ans.correctAnswer}</p>
                      </div>
                    )}

                    {/* Explanation */}
                    {result.exam.showExplanation && ans.explanation && (
                      <div>
                        <p className="text-xs font-semibold text-blue-700 mb-1">💡 Giải thích:</p>
                        <p className="text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">{ans.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/exam/join"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Về trang vào thi
          </Link>
        </div>
      </div>
    </div>
  );
}
