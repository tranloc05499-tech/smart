"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  HelpCircle,
  CheckCircle2,
  Sparkles,
  Save,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

interface QuestionOption {
  id?: string;
  label: string;
  content: string;
  isCorrect: boolean;
}

interface ExamQuestionItem {
  id: string;
  order: number;
  points: number;
  question: {
    id: string;
    content: string;
    type: string;
    points: number;
    explanation: string | null;
    options: QuestionOption[];
  };
}

interface ExamDetails {
  id: string;
  title: string;
  code: string;
  durationMinutes: number;
  status: string;
  questions: ExamQuestionItem[];
}

export default function ExamQuestionsEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: examId } = use(params);

  const [exam, setExam] = useState<ExamDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New question form state
  const [content, setContent] = useState("");
  const [type, setType] = useState("single_choice");
  const [points, setPoints] = useState(1);
  const [explanation, setExplanation] = useState("");
  const [options, setOptions] = useState<QuestionOption[]>([
    { label: "A", content: "", isCorrect: true },
    { label: "B", content: "", isCorrect: false },
    { label: "C", content: "", isCorrect: false },
    { label: "D", content: "", isCorrect: false },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const fetchExamDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/exams/${examId}`);
      if (res.ok) {
        const data = await res.json();
        setExam(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchExamDetails();
  }, [examId]);

  const handleOptionChange = (index: number, val: string) => {
    setOptions((prev) => {
      const copy = [...prev];
      copy[index].content = val;
      return copy;
    });
  };

  const handleSetCorrect = (index: number) => {
    setOptions((prev) =>
      prev.map((opt, i) => ({
        ...opt,
        isCorrect: type === "multiple_choice" ? (i === index ? !opt.isCorrect : opt.isCorrect) : i === index,
      }))
    );
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/exams/${examId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          type,
          points: Number(points),
          explanation: explanation.trim() || undefined,
          options: type === "essay" ? [] : options.filter((o) => o.content.trim().length > 0),
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setContent("");
        setExplanation("");
        setOptions([
          { label: "A", content: "", isCorrect: true },
          { label: "B", content: "", isCorrect: false },
          { label: "C", content: "", isCorrect: false },
          { label: "D", content: "", isCorrect: false },
        ]);
        fetchExamDetails();
      } else {
        const err = await res.json();
        alert(err.error || "Lỗi tạo câu hỏi");
      }
    } catch (err) {
      alert("Lỗi kết nối");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (eqId: string) => {
    if (!confirm("Bạn có chắc muốn xoá câu hỏi này khỏi đề thi?")) return;
    try {
      const res = await fetch(`/api/exams/${examId}/questions?questionId=${eqId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchExamDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Không tìm thấy đề thi</p>
        <Link href="/teacher/exams" className="text-blue-600 text-sm mt-2 inline-block">
          ← Về danh sách đề thi
        </Link>
      </div>
    );
  }

  const totalPoints = exam.questions?.reduce((acc, q) => acc + (q.points || 1), 0) || 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/teacher/exams"
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{exam.title}</h1>
              <Badge variant="secondary" className="font-mono text-xs">
                {exam.code}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Thời gian: {exam.durationMinutes} phút • Tổng: {exam.questions?.length || 0} câu ({totalPoints} điểm)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-sm shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Thêm câu hỏi
          </Button>
        </div>
      </div>

      {/* Questions List */}
      {!exam.questions || exam.questions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-3">
            <HelpCircle className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Đề thi chưa có câu hỏi nào</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            Hãy thêm câu hỏi trắc nghiệm hoặc tự luận để học sinh có thể bắt đầu làm bài.
          </p>
          <Button
            onClick={() => setShowAddModal(true)}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            Thêm câu hỏi đầu tiên
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {exam.questions.map((item, idx) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg">
                    Câu {idx + 1}
                  </span>
                  <span className="text-xs text-slate-400 font-medium capitalize">
                    {item.question.type === "single_choice"
                      ? "Trắc nghiệm một đáp án"
                      : item.question.type === "multiple_choice"
                      ? "Nhiều đáp án"
                      : item.question.type === "essay"
                      ? "Tự luận"
                      : "Điền khuyết"}
                  </span>
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {item.points} điểm
                  </span>
                </div>

                <button
                  onClick={() => handleDeleteQuestion(item.id)}
                  className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Question Content */}
              <p className="text-sm text-slate-800 font-medium mb-4 whitespace-pre-line">
                {item.question.content}
              </p>

              {/* Options */}
              {item.question.options && item.question.options.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {item.question.options.map((opt) => (
                    <div
                      key={opt.id || opt.label}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs transition-colors ${
                        opt.isCorrect
                          ? "bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold"
                          : "bg-slate-50/50 border-slate-200 text-slate-700"
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                          opt.isCorrect
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {opt.label}
                      </span>
                      <span className="truncate">{opt.content}</span>
                      {opt.isCorrect && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 ml-auto shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {item.question.explanation && (
                <div className="mt-3 p-2.5 bg-amber-50/60 border border-amber-200/60 rounded-xl text-xs text-amber-900">
                  <span className="font-semibold">Giải thích: </span>
                  {item.question.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Thêm Câu Hỏi */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 my-8">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Thêm Câu Hỏi Vào Đề Thi</h2>
            <p className="text-xs text-slate-500 mb-5">
              Nhập nội dung câu hỏi, định dạng đáp án và chỉ định câu trả lời chính xác.
            </p>

            <form onSubmit={handleAddQuestion} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Loại câu hỏi
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="single_choice">Trắc nghiệm (1 đáp án)</option>
                    <option value="multiple_choice">Trắc nghiệm (Nhiều đáp án)</option>
                    <option value="essay">Tự luận</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Điểm số
                  </label>
                  <Input
                    type="number"
                    step={0.25}
                    min={0.25}
                    max={10}
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nội dung câu hỏi <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Nhập nội dung câu hỏi tại đây..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {type !== "essay" && (
                <div className="space-y-2.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Các lựa chọn đáp án (Chọn vào chữ cái để đánh dấu đáp án ĐÚNG)
                  </label>
                  {options.map((opt, idx) => (
                    <div key={opt.label} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSetCorrect(idx)}
                        className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${
                          opt.isCorrect
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                        title="Bấm để đặt làm đáp án đúng"
                      >
                        {opt.label}
                      </button>
                      <Input
                        required
                        value={opt.content}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Nội dung lựa chọn ${opt.label}...`}
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lời giải chi tiết / Hướng dẫn giải (Tùy chọn)
                </label>
                <textarea
                  rows={2}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Giải thích lý do chọn đáp án đúng..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {submitting ? "Đang lưu..." : "Lưu câu hỏi"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
