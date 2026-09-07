"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  Share2,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Users,
  Eye,
  Settings,
  Sparkles,
  Upload,
  FileUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

interface Exam {
  id: string;
  title: string;
  code: string;
  durationMinutes: number;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  passScore: number;
  antiCheatLevel: number;
  createdAt: string;
  _count: {
    questions: number;
    attempts: number;
    classes: number;
  };
}

export default function TeacherExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // New exam form state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDuration, setNewDuration] = useState(45);
  const [newPassScore, setNewPassScore] = useState(5);
  const [newAntiCheat, setNewAntiCheat] = useState(1);
  const [creating, setCreating] = useState(false);

  // AI Creator Form State
  const [aiTitle, setAiTitle] = useState("");
  const [aiDuration, setAiDuration] = useState(45);
  const [aiPassScore, setAiPassScore] = useState(5);
  const [aiAntiCheat, setAiAntiCheat] = useState(1);
  const [aiFile, setAiFile] = useState<File | null>(null);
  const [aiText, setAiText] = useState("");
  const [aiParsing, setAiParsing] = useState(false);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/exams");
      if (res.ok) {
        const json = await res.json();
        const items = Array.isArray(json) ? json : json.data || [];
        setExams(
          items.map((e: {
            id: string;
            title: string;
            code: string;
            durationMinutes: number;
            status: "DRAFT" | "PUBLISHED" | "CLOSED";
            passScore: number;
            antiCheatLevel: number;
            createdAt: string;
            _count?: { questions: number; attempts: number; classes: number };
            questionsCount?: number;
            attemptsCount?: number;
            classesCount?: number;
          }) => ({
            id: e.id,
            title: e.title,
            code: e.code,
            durationMinutes: e.durationMinutes,
            status: e.status,
            passScore: e.passScore,
            antiCheatLevel: e.antiCheatLevel,
            createdAt: e.createdAt,
            _count: {
              questions: e._count?.questions ?? e.questionsCount ?? 0,
              attempts: e._count?.attempts ?? e.attemptsCount ?? 0,
              classes: e._count?.classes ?? e.classesCount ?? 0,
            },
          }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch exams:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchExams();
  }, []);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setCreating(true);
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim() || undefined,
          durationMinutes: Number(newDuration),
          passScore: Number(newPassScore),
          antiCheatLevel: Number(newAntiCheat),
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewTitle("");
        setNewDescription("");
        fetchExams();
      } else {
        const err = await res.json();
        alert(err.error || "Không thể tạo đề thi");
      }
    } catch (err) {
      alert("Lỗi kết nối khi tạo đề thi");
    } finally {
      setCreating(false);
    }
  };

  const handleAiCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiFile && !aiText.trim()) {
      alert("Vui lòng tải lên file đề thi hoặc dán nội dung văn bản câu hỏi.");
      return;
    }

    try {
      setAiParsing(true);
      const formData = new FormData();
      if (aiFile) formData.append("file", aiFile);
      if (aiText.trim()) formData.append("text", aiText.trim());
      formData.append("title", aiTitle.trim() || "Đề thi số hoá AI");
      formData.append("durationMinutes", String(aiDuration));
      formData.append("passScore", String(aiPassScore));
      formData.append("antiCheatLevel", String(aiAntiCheat));

      const res = await fetch("/api/exams/ai-parse", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Tạo đề thi bằng AI thành công!");
        setShowAiModal(false);
        setAiFile(null);
        setAiText("");
        setAiTitle("");
        fetchExams();
      } else {
        alert(data.error || "Không thể phân tích đề thi");
      }
    } catch (err) {
      alert("Lỗi kết nối khi tải lên đề thi");
    } finally {
      setAiParsing(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "PUBLISHED" ? "CLOSED" : "PUBLISHED";
    try {
      const res = await fetch(`/api/exams/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        fetchExams();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc muốn xóa đề thi "${title}"? Dữ liệu bài làm liên quan sẽ bị ảnh hưởng.`)) return;
    try {
      const res = await fetch(`/api/exams/${id}`, { method: "DELETE" });
      if (res.ok) {
        setExams(prev => prev.filter(e => e.id !== id));
      } else {
        alert("Không thể xóa đề thi");
      }
    } catch (err) {
      alert("Lỗi kết nối khi xóa");
    }
  };

  const copyExamLink = (code: string) => {
    const url = `${window.location.origin}/exam/join?code=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const filteredExams = exams.filter((exam) => {
    const matchesSearch =
      exam.title.toLowerCase().includes(search.toLowerCase()) ||
      exam.code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || exam.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Quản lý Đề thi
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tạo đề thi trắc nghiệm & tự luận thủ công hoặc tải file Word/PDF để AI số hoá tự động
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setShowAiModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-xs"
          >
            <Sparkles className="h-4 w-4" />
            Tạo đề thi bằng AI
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Tạo đề thủ công
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
            placeholder="Tìm theo tên hoặc mã đề..."
            className="pl-9 bg-slate-50 border-slate-200 text-sm focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-medium text-slate-500 hidden sm:inline">Trạng thái:</span>
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-medium">
            {[
              { id: "ALL", label: "Tất cả" },
              { id: "PUBLISHED", label: "Đang mở" },
              { id: "DRAFT", label: "Bản nháp" },
              { id: "CLOSED", label: "Đã đóng" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === tab.id
                    ? "bg-white text-slate-900 font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Exams Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500">Đang tải danh sách đề thi...</p>
          </div>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-3">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Chưa có đề thi nào</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            Bắt đầu tạo bài kiểm tra trực tuyến hoặc đề thi định kỳ cho học sinh của bạn ngay hôm nay.
          </p>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            Tạo đề thi đầu tiên
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <Badge
                    variant={
                      exam.status === "PUBLISHED"
                        ? "success"
                        : exam.status === "DRAFT"
                        ? "secondary"
                        : "destructive"
                    }
                    className="capitalize"
                  >
                    {exam.status === "PUBLISHED"
                      ? "Đang mở thi"
                      : exam.status === "DRAFT"
                      ? "Bản nháp"
                      : "Đã đóng"}
                  </Badge>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                      Mã: {exam.code}
                    </span>
                    <button
                      onClick={() => copyExamLink(exam.code)}
                      title="Sao chép link vào thi"
                      className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    {copiedCode === exam.code && (
                      <span className="text-[10px] text-green-600 font-medium">Đã chép!</span>
                    )}
                  </div>
                </div>

                <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {exam.title}
                </h3>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 py-3.5 my-3 border-y border-slate-100 text-center">
                  <div>
                    <div className="text-base font-bold text-slate-800">
                      {exam._count.questions}
                    </div>
                    <div className="text-[11px] text-slate-400">Câu hỏi</div>
                  </div>
                  <div>
                    <div className="text-base font-bold text-blue-600">
                      {exam.durationMinutes}&apos;
                    </div>
                    <div className="text-[11px] text-slate-400">Thời gian</div>
                  </div>
                  <div>
                    <div className="text-base font-bold text-emerald-600">
                      {exam._count.attempts}
                    </div>
                    <div className="text-[11px] text-slate-400">Lượt nộp</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    {exam._count.classes} lớp gán
                  </span>
                  <span>Điểm đạt: {exam.passScore}/10</span>
                </div>
              </div>

              {/* Action Bar */}
              <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStatus(exam.id, exam.status)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                      exam.status === "PUBLISHED"
                        ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                    }`}
                  >
                    {exam.status === "PUBLISHED" ? "Tạm đóng" : "Mở thi"}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/teacher/exams/${exam.id}/questions`}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 p-1"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Câu hỏi
                  </Link>
                  <Link
                    href={`/teacher/exams/${exam.id}/results`}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 p-1"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Kết quả
                  </Link>
                  <button
                    onClick={() => handleDelete(exam.id, exam.title)}
                    className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tạo Đề Thi */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Tạo Đề Thi Mới</h2>
            <p className="text-xs text-slate-500 mb-5">
              Cấu hình thông tin cơ bản cho đề thi trước khi thêm câu hỏi và gán lớp.
            </p>

            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tiêu đề đề thi <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="VD: Kiểm tra 1 tiết Toán hình - Chương 2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mô tả / Hướng dẫn làm bài
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Ghi chú thêm về quy chế hoặc lưu ý cho học sinh..."
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Thời lượng (phút)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={360}
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Điểm đạt (thang 10)
                  </label>
                  <Input
                    type="number"
                    step={0.5}
                    min={0}
                    max={10}
                    value={newPassScore}
                    onChange={(e) => setNewPassScore(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cấp độ chống gian lận (Anti-cheat)
                </label>
                <select
                  value={newAntiCheat}
                  onChange={(e) => setNewAntiCheat(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>Mức 0: Không giám sát</option>
                  <option value={1}>Mức 1: Bắt sự kiện chuyển tab / rời màn hình</option>
                  <option value={2}>Mức 2: Toàn màn hình bắt buộc + Giám sát tab</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {creating ? "Đang tạo..." : "Tạo đề thi"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tạo Đề Thi Bằng AI */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-100 my-8">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Tạo Đề Thi Bằng AI</h2>
            </div>
            <p className="text-xs text-slate-500 mb-5">
              Tải lên DOCX/PDF có text layer hoặc nhập thủ công. Hệ thống giữ công thức dạng text, ảnh nhúng trong DOCX và tự tạo phòng thi online.
            </p>

            <form onSubmit={handleAiCreateExam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên đề thi
                </label>
                <Input
                  value={aiTitle}
                  onChange={(e) => setAiTitle(e.target.value)}
                  placeholder="VD: Kiểm tra 15 phút Toán học số hoá AI"
                />
              </div>

              {/* File upload box */}
              <div className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-2xl p-4 text-center bg-indigo-50/30 transition-colors">
                <FileUp className="h-8 w-8 text-indigo-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">
                  Chọn file Word (.docx), PDF hoặc Text (.txt)
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  DOCX giữ ảnh nhúng; PDF scan cần OCR trước. Mẫu: Câu 1: ... A. ... B. ... C. ... D. ... Đáp án: A
                </p>
                <input
                  type="file"
                  id="ai-file-upload"
                  accept=".txt,.docx,.pdf,.md"
                  onChange={(e) => setAiFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label
                  htmlFor="ai-file-upload"
                  className="mt-3 inline-block cursor-pointer text-xs font-semibold bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 shadow-xs"
                >
                  {aiFile ? `Đã chọn: ${aiFile.name}` : "Tải lên file đề thi"}
                </label>
              </div>

              {/* Or paste text */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hoặc nhập/dán thủ công từng câu hỏi, lựa chọn và đáp án
                </label>
                <textarea
                  rows={4}
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  placeholder="Dán nội dung câu hỏi tại đây:&#10;Câu 1: Thủ đô của Việt Nam là gì?&#10;A. Hà Nội&#10;B. Đà Nẵng&#10;C. TP. Hồ Chí Minh&#10;D. Huế&#10;Đáp án: A"
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Thời lượng làm bài (phút)
                  </label>
                  <Input
                    type="number"
                    min={5}
                    max={300}
                    value={aiDuration}
                    onChange={(e) => setAiDuration(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Điểm đạt (thang 10)
                  </label>
                  <Input
                    type="number"
                    step={0.5}
                    min={0}
                    max={10}
                    value={aiPassScore}
                    onChange={(e) => setAiPassScore(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cấp độ chống gian lận (Anti-cheat)
                </label>
                <select
                  value={aiAntiCheat}
                  onChange={(e) => setAiAntiCheat(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={0}>Mức 0: Không giám sát</option>
                  <option value={1}>Mức 1: Bắt sự kiện chuyển tab / rời màn hình</option>
                  <option value={2}>Mức 2: Toàn màn hình bắt buộc + Giám sát tab</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAiModal(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={aiParsing}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
                >
                  <Sparkles className="h-4 w-4" />
                  {aiParsing ? "AI Đang Số Hoá..." : "Bắt đầu số hoá & Tạo đề"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
