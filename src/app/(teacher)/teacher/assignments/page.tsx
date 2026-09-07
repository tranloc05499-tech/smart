"use client";

import React, { useEffect, useState } from "react";
import {
  FileCheck,
  Plus,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

interface AssignmentItem {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  allowLate: boolean;
  status: string;
  createdAt: string;
  class: {
    name: string;
    code: string;
    gradeLevel: number;
  };
  _count: {
    submissions: number;
  };
}

interface Classroom {
  id: string;
  name: string;
  code: string;
}

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [classId, setClassId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [allowLate, setAllowLate] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resAss, resClasses] = await Promise.all([
        fetch("/api/assignments"),
        fetch("/api/classes"),
      ]);

      if (resAss.ok) {
        const dAss = await resAss.json();
        setAssignments(Array.isArray(dAss) ? dAss : dAss.data || []);
      }
      if (resClasses.ok) {
        const dCls = await resClasses.json();
        setClasses(dCls);
        if (dCls.length > 0) setClassId(dCls[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !classId) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          title: title.trim(),
          description: description.trim() || undefined,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          allowLate,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setTitle("");
        setDescription("");
        setDueDate("");
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Không thể tạo bài tập");
      }
    } catch (err) {
      alert("Lỗi kết nối");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xoá bài tập này?")) return;
    try {
      const res = await fetch(`/api/assignments/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAssignments((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = assignments.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.class.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Quản Lý Bài Tập Về Nhà
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Giao bài tập tự luận, bài tập file hoặc trắc nghiệm theo lớp kèm hạn nộp
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Giao bài tập mới
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tiêu đề bài tập, lớp..."
            className="pl-9 bg-slate-50 border-slate-200 text-sm"
          />
        </div>
      </div>

      {/* Assignments list */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-3">
            <FileCheck className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Chưa có bài tập nào</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            Giao bài tập về nhà để học sinh rèn luyện và nộp bài trực tuyến.
          </p>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            Giao bài tập đầu tiên
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <Badge variant="secondary" className="font-semibold text-xs">
                    {item.class.name}
                  </Badge>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mt-1">
                  {item.title}
                </h3>

                {item.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mt-2">
                    {item.description}
                  </p>
                )}

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {item.dueDate
                      ? new Date(item.dueDate).toLocaleDateString("vi-VN")
                      : "Không giới hạn"}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    {item._count.submissions} bài nộp
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tạo Bài Tập */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Giao Bài Tập Mới</h2>
            <p className="text-xs text-slate-500 mb-5">
              Chọn lớp học và thiết lập thông tin bài tập cùng hạn nộp.
            </p>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lớp học nhận bài <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tiêu đề bài tập <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Phiếu bài tập tuần 5 - Đại số"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nội dung yêu cầu / Hướng dẫn
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả bài tập hoặc yêu cầu đính kèm..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hạn nộp bài
                </label>
                <Input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allowLate"
                  checked={allowLate}
                  onChange={(e) => setAllowLate(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="allowLate" className="text-xs text-slate-700 select-none">
                  Cho phép nộp muộn sau hạn chót
                </label>
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
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {submitting ? "Đang giao..." : "Giao bài"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
