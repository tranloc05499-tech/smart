"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  PenTool,
  CheckCircle,
  Clock,
  Search,
  Eye,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

interface SubmissionItem {
  id: string;
  studentName: string;
  studentCode: string | null;
  score: number | null;
  status: string;
  submittedAt: string | null;
  exam: {
    id: string;
    title: string;
    code: string;
  };
}

export default function TeacherGradingPage() {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch("/api/exams");
        if (res.ok) {
          const exams = await res.json();
          const allSubs: SubmissionItem[] = [];

          for (const exam of exams) {
            const resRes = await fetch(`/api/exams/${exam.id}/results`);
            if (resRes.ok) {
              const results = await resRes.json();
              results.forEach((r: { id: string; studentName: string; studentCode: string | null; score: number | null; status: string; submittedAt: string | null }) => {
                allSubs.push({
                  id: r.id,
                  studentName: r.studentName,
                  studentCode: r.studentCode,
                  score: r.score,
                  status: r.status,
                  submittedAt: r.submittedAt,
                  exam: { id: exam.id, title: exam.title, code: exam.code },
                });
              });
            }
          }
          setSubmissions(allSubs);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = submissions.filter((s) => {
    const term = search.toLowerCase();
    return (
      s.studentName.toLowerCase().includes(term) ||
      s.exam.title.toLowerCase().includes(term) ||
      s.exam.code.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Chấm & Soát Bài Thi
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Xem lại các bài làm trực tuyến, chấm điểm câu hỏi tự luận và xem phản hồi học sinh
        </p>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên học sinh, đề thi..."
            className="pl-9 bg-slate-50 border-slate-200 text-sm focus:bg-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Chưa có bài thi nào nộp cần chấm hoặc xem lại.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Học sinh</th>
                  <th className="px-5 py-3.5">Đề thi</th>
                  <th className="px-5 py-3.5">Mã đề</th>
                  <th className="px-5 py-3.5">Thời gian nộp</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5 text-right">Điểm</th>
                  <th className="px-5 py-3.5 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-900">
                      {item.studentName}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 max-w-xs truncate">
                      {item.exam.title}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500">
                      {item.exam.code}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {item.submittedAt
                        ? new Date(item.submittedAt).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "2-digit",
                          })
                        : "Đang làm..."}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={item.status === "SUBMITTED" || item.status === "GRADED" ? "success" : "yellow"}
                        className="text-xs"
                      >
                        {item.status === "SUBMITTED" ? "Đã nộp" : item.status === "GRADED" ? "Đã chấm" : "Đang làm"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-base text-blue-600">
                      {item.score !== null ? item.score.toFixed(1) : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Link
                        href={`/exam/result/${item.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Chấm / Xem bài
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
