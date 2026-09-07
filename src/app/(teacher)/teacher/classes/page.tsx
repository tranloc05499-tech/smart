"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  GraduationCap, Plus, Search, Users, BookOpen, X,
  Copy, Check, MoreHorizontal, Trash2, Eye
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ClassItem {
  id: string; name: string; code: string; subject: string;
  grade: number; schoolYear: string; description?: string;
  studentsCount: number; assignmentsCount: number; examsCount: number;
  createdAt: string;
}

const SUBJECTS = ["Toán", "Lý", "Hóa", "Sinh", "Văn", "Sử", "Địa", "Anh", "Tin học", "GDCD", "Công nghệ"];

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", subject: "Toán", grade: 12, schoolYear: "2026-2027", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/classes");
      const data = await res.json();
      setClasses(Array.isArray(data) ? data : []);
    } catch { setClasses([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchClasses();
  }, [fetchClasses]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError("");
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, grade: Number(form.grade) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Lỗi tạo lớp"); return; }
      setShowModal(false);
      setForm({ name: "", subject: "Toán", grade: 12, schoolYear: "2026-2027", description: "" });
      fetchClasses();
    } catch { setError("Lỗi kết nối server"); }
    finally { setSubmitting(false); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filtered = classes.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.subject.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const subjectColors: Record<string, string> = {
    "Toán": "bg-blue-100 text-blue-800",
    "Lý": "bg-purple-100 text-purple-800",
    "Hóa": "bg-green-100 text-green-800",
    "Sinh": "bg-emerald-100 text-emerald-800",
    "Văn": "bg-red-100 text-red-800",
    "Anh": "bg-yellow-100 text-yellow-800",
    "Tin học": "bg-indigo-100 text-indigo-800",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lớp học</h1>
          <p className="text-sm text-slate-500 mt-0.5">{classes.length} lớp đang quản lý</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Plus className="h-4 w-4" /> Tạo lớp mới
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm lớp học theo tên, môn, mã lớp..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
        />
      </div>

      {/* Classes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <GraduationCap className="h-12 w-12 mb-3 opacity-40" />
          <p className="font-medium text-slate-500">Chưa có lớp học nào</p>
          <p className="text-sm mt-1">Bấm &quot;Tạo lớp mới&quot; để bắt đầu</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(cls => (
            <div key={cls.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", subjectColors[cls.subject] || "bg-slate-100 text-slate-700")}>
                    {cls.subject} • Lớp {cls.grade}
                  </span>
                  <h3 className="font-bold text-slate-900 mt-2 text-base leading-tight">{cls.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{cls.schoolYear}</p>
                </div>
                <button className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-slate-100 transition-all">
                  <MoreHorizontal className="h-4 w-4 text-slate-500" />
                </button>
              </div>

              {/* Class Code */}
              <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 mb-3">
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Mã tham gia</p>
                  <p className="font-mono text-sm font-bold text-slate-800">{cls.code}</p>
                </div>
                <button onClick={() => copyCode(cls.code)} className="p-1.5 hover:bg-white rounded-lg transition-colors">
                  {copiedCode === cls.code ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-slate-400 hover:text-slate-700" />
                  )}
                </button>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" /> {cls.studentsCount} HS
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" /> {cls.assignmentsCount} bài tập
                </span>
                <span className="flex items-center gap-1.5">
                  📝 {cls.examsCount} đề thi
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                <Link href={`/teacher/classes/${cls.id}`} className="flex-1">
                  <button className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                    <Eye className="h-3.5 w-3.5" /> Xem chi tiết
                  </button>
                </Link>
                <Link href={`/teacher/classes/${cls.id}`} className="flex-1">
                  <button className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                    <Users className="h-3.5 w-3.5" /> Học sinh
                  </button>
                </Link>
                <button
                  onClick={async () => {
                    if (confirm(`Bạn có chắc muốn xoá lớp "${cls.name}"? Dữ liệu điểm số và bài tập liên quan sẽ bị xoá.`)) {
                      const res = await fetch(`/api/classes/${cls.id}`, { method: "DELETE" });
                      if (res.ok) fetchClasses();
                      else alert("Không thể xoá lớp học");
                    }
                  }}
                  title="Xoá lớp học"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Tạo lớp học mới</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tên lớp <span className="text-red-500">*</span></label>
                <Input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Ví dụ: 12A1, Lớp Toán Nâng Cao..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Môn học <span className="text-red-500">*</span></label>
                  <select
                    value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Khối lớp <span className="text-red-500">*</span></label>
                  <select
                    value={form.grade}
                    onChange={e => setForm({ ...form, grade: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>Lớp {i + 1}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Năm học</label>
                <select
                  value={form.schoolYear}
                  onChange={e => setForm({ ...form, schoolYear: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="2025-2026">2025-2026</option>
                  <option value="2026-2027">2026-2027</option>
                  <option value="2027-2028">2027-2028</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Mô tả (tuỳ chọn)</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Mô tả thêm về lớp học..."
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="flex-1"
                  disabled={submitting}
                >
                  Huỷ
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={submitting}
                >
                  {submitting ? "Đang tạo..." : "Tạo lớp"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
