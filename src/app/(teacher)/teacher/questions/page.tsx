"use client";

import React, { useEffect, useState } from "react";
import {
  HelpCircle,
  Plus,
  Search,
  BookOpen,
  Tag,
  Trash2,
  CheckCircle2,
  Filter,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

interface QuestionItem {
  id: string;
  content: string;
  type: string;
  difficulty: string;
  points: number;
  gradeLevel: number | null;
  subject: string | null;
  createdAt: string;
  options: {
    id: string;
    label: string;
    content: string;
    isCorrect: boolean;
  }[];
  bank?: {
    title: string;
  } | null;
}

export default function QuestionsBankPage() {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [content, setContent] = useState("");
  const [type, setType] = useState("single_choice");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [subject, setSubject] = useState("Toán học");
  const [points, setPoints] = useState(1);
  const [explanation, setExplanation] = useState("");
  const [options, setOptions] = useState([
    { label: "A", content: "", isCorrect: true },
    { label: "B", content: "", isCorrect: false },
    { label: "C", content: "", isCorrect: false },
    { label: "D", content: "", isCorrect: false },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/questions");
      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchQuestions();
  }, []);

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

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          type,
          difficulty,
          subject: subject.trim() || undefined,
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
        fetchQuestions();
      } else {
        const err = await res.json();
        alert(err.error || "Không thể thêm câu hỏi");
      }
    } catch (err) {
      alert("Lỗi kết nối khi thêm câu hỏi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xoá câu hỏi này khỏi kho?")) return;
    try {
      const res = await fetch(`/api/questions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setQuestions((prev) => prev.filter((q) => q.id !== id));
      } else {
        alert("Không thể xoá câu hỏi");
      }
    } catch (err) {
      alert("Lỗi kết nối");
    }
  };

  const filtered = questions.filter((q) => {
    const matchesSearch =
      q.content.toLowerCase().includes(search.toLowerCase()) ||
      (q.subject && q.subject.toLowerCase().includes(search.toLowerCase()));
    const matchesType = typeFilter === "ALL" || q.type === typeFilter;
    const matchesDifficulty =
      difficultyFilter === "ALL" || q.difficulty === difficultyFilter;

    return matchesSearch && matchesType && matchesDifficulty;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Ngân Hàng Câu Hỏi
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kho lưu trữ câu hỏi dùng chung theo môn học, khối lớp và mức độ nhận thức
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Tạo câu hỏi mới
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo nội dung, môn học..."
            className="pl-9 bg-slate-50 border-slate-200 text-sm focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none"
          >
            <option value="ALL">Mọi định dạng</option>
            <option value="single_choice">Trắc nghiệm 1 đáp án</option>
            <option value="multiple_choice">Nhiều đáp án</option>
            <option value="essay">Tự luận</option>
          </select>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none"
          >
            <option value="ALL">Mọi độ khó</option>
            <option value="EASY">Nhận biết (Dễ)</option>
            <option value="MEDIUM">Thông hiểu (Vừa)</option>
            <option value="HARD">Vận dụng (Khó)</option>
            <option value="VERY_HARD">Vận dụng cao</option>
          </select>
        </div>
      </div>

      {/* Questions list */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-3">
            <HelpCircle className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Kho câu hỏi đang trống</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            Bắt đầu tạo câu hỏi để tái sử dụng trong các đề thi và bài tập tiếp theo.
          </p>
          <Button
            onClick={() => setShowAddModal(true)}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            Tạo câu hỏi đầu tiên
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item, idx) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                    #{idx + 1}
                  </span>
                  {item.subject && (
                    <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded">
                      {item.subject}
                    </span>
                  )}
                  <Badge
                    variant={
                      item.difficulty === "EASY"
                        ? "success"
                        : item.difficulty === "MEDIUM"
                        ? "secondary"
                        : "destructive"
                    }
                    className="text-[10px]"
                  >
                    {item.difficulty === "EASY"
                      ? "Nhận biết"
                      : item.difficulty === "MEDIUM"
                      ? "Thông hiểu"
                      : "Vận dụng"}
                  </Badge>
                  <span className="text-xs text-slate-400 capitalize">
                    {item.type === "single_choice"
                      ? "Trắc nghiệm 1 đáp án"
                      : item.type === "multiple_choice"
                      ? "Nhiều đáp án"
                      : "Tự luận"}
                  </span>
                </div>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <p className="text-sm text-slate-800 font-medium mb-3 whitespace-pre-line">
                {item.content}
              </p>

              {item.options && item.options.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {item.options.map((opt) => (
                    <div
                      key={opt.id}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-xs ${
                        opt.isCorrect
                          ? "bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold"
                          : "bg-slate-50 border-slate-200 text-slate-700"
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
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
            </div>
          ))}
        </div>
      )}

      {/* Modal Tạo Câu Hỏi */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 my-8">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Tạo Câu Hỏi Mới</h2>
            <p className="text-xs text-slate-500 mb-5">
              Lưu trữ câu hỏi vào ngân hàng dùng chung của bạn
            </p>

            <form onSubmit={handleCreateQuestion} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Môn học
                  </label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="VD: Toán học, Vật lý..."
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Độ khó
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="EASY">Nhận biết</option>
                    <option value="MEDIUM">Thông hiểu</option>
                    <option value="HARD">Vận dụng</option>
                    <option value="VERY_HARD">Vận dụng cao</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Định dạng
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="single_choice">Trắc nghiệm (1 đáp án)</option>
                    <option value="multiple_choice">Nhiều đáp án</option>
                    <option value="essay">Tự luận</option>
                  </select>
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
                  placeholder="Nhập nội dung câu hỏi..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {type !== "essay" && (
                <div className="space-y-2.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Các lựa chọn (Bấm vào chữ cái để chọn đáp án đúng)
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
                      >
                        {opt.label}
                      </button>
                      <Input
                        required
                        value={opt.content}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Lựa chọn ${opt.label}...`}
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hướng dẫn giải chi tiết
                </label>
                <textarea
                  rows={2}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Lời giải thích cho câu hỏi này..."
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
                  {submitting ? "Đang lưu..." : "Lưu vào ngân hàng"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
