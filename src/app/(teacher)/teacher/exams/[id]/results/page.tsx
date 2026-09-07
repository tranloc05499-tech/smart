"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  CheckCircle,
  Clock,
  Download,
  Search,
  AlertTriangle,
  Award,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

interface ExamAttempt {
  id: string;
  studentName: string;
  studentCode: string | null;
  score: number | null;
  status: string;
  startedAt: string;
  submittedAt: string | null;
  user: {
    fullName: string;
    email: string;
  } | null;
}

interface ExamInfo {
  id: string;
  title: string;
  code: string;
  passScore: number;
  durationMinutes: number;
}

export default function ExamResultsTeacherPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: examId } = use(params);

  const [exam, setExam] = useState<ExamInfo | null>(null);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resExam, resAttempts] = await Promise.all([
          fetch(`/api/exams/${examId}`),
          fetch(`/api/exams/${examId}/results`),
        ]);

        if (resExam.ok) {
          const data = await resExam.json();
          setExam(data);
        }
        if (resAttempts.ok) {
          const data = await resAttempts.json();
          setAttempts(data);
        }
      } catch (err) {
        console.error("Lỗi nạp danh sách kết quả:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [examId]);

  const filtered = attempts.filter((a) => {
    const name = (a.studentName || a.user?.fullName || "").toLowerCase();
    const code = (a.studentCode || "").toLowerCase();
    return name.includes(search.toLowerCase()) || code.includes(search.toLowerCase());
  });

  const submittedAttempts = attempts.filter((a) => a.status === "SUBMITTED" || a.status === "GRADED");
  const avgScore =
    submittedAttempts.length > 0
      ? (
          submittedAttempts.reduce((acc, curr) => acc + (curr.score || 0), 0) /
          submittedAttempts.length
        ).toFixed(1)
      : "0.0";

  const passCount = submittedAttempts.filter(
    (a) => a.score !== null && a.score >= (exam?.passScore || 5)
  ).length;

  const passRate =
    submittedAttempts.length > 0
      ? Math.round((passCount / submittedAttempts.length) * 100)
      : 0;

  const exportResults = () => {
    const rows = [
      ["Học sinh", "Mã học sinh", "Trạng thái", "Điểm", "Bắt đầu", "Nộp bài"],
      ...filtered.map((attempt) => [
        attempt.studentName || attempt.user?.fullName || "Khách tự do",
        attempt.studentCode || "",
        attempt.status,
        attempt.score === null ? "" : String(attempt.score),
        new Date(attempt.startedAt).toLocaleString("vi-VN"),
        attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString("vi-VN") : "",
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bang-diem-${exam?.code || examId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/teacher/exams"
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Kết Quả Bài Thi: {exam?.title || "..."}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Mã phòng thi: <span className="font-mono font-bold text-slate-700">{exam?.code}</span> • Điểm đạt: {exam?.passScore}/10
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={exportResults}
          className="gap-2 text-xs"
        >
          <Download className="h-3.5 w-3.5" />
          Xuất bảng điểm
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-400 uppercase">Tổng lượt thi</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{attempts.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {submittedAttempts.length} lượt đã nộp bài
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-400 uppercase">Điểm trung bình</div>
          <div className="text-2xl font-bold text-blue-600 mt-2">{avgScore}</div>
          <div className="text-[11px] text-slate-500 mt-1">Thang điểm 10</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-400 uppercase">Tỷ lệ đạt</div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{passRate}%</div>
          <div className="text-[11px] text-slate-500 mt-1">{passCount} học sinh đạt ngưỡng</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-400 uppercase">Đang làm bài</div>
          <div className="text-2xl font-bold text-amber-500 mt-2">
            {attempts.filter((a) => a.status === "IN_PROGRESS").length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Trực tuyến ngay lúc này</div>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên học sinh, mã HS..."
              className="pl-9 bg-slate-50 text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Chưa có học sinh nào nộp bài hoặc không tìm thấy kết quả phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Học sinh</th>
                  <th className="px-5 py-3">Mã định danh</th>
                  <th className="px-5 py-3">Bắt đầu</th>
                  <th className="px-5 py-3">Thời gian nộp</th>
                  <th className="px-5 py-3">Trạng thái</th>
                  <th className="px-5 py-3 text-right">Điểm số</th>
                  <th className="px-5 py-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((attempt) => {
                  const isPassed =
                    attempt.score !== null &&
                    attempt.score >= (exam?.passScore || 5);

                  return (
                    <tr key={attempt.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-slate-900">
                        {attempt.studentName || attempt.user?.fullName || "Khách tự do"}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500">
                        {attempt.studentCode || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {new Date(attempt.startedAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {attempt.submittedAt
                          ? new Date(attempt.submittedAt).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "2-digit",
                              month: "2-digit",
                            })
                          : "Đang làm..."}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge
                          variant={
                            attempt.status === "SUBMITTED" || attempt.status === "GRADED"
                              ? isPassed
                                ? "success"
                                : "destructive"
                              : "secondary"
                          }
                          className="text-[11px]"
                        >
                          {attempt.status === "IN_PROGRESS"
                            ? "Đang thi"
                            : isPassed
                            ? "Đạt"
                            : "Không đạt"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-base">
                        {attempt.score !== null ? (
                          <span className={isPassed ? "text-emerald-600" : "text-red-500"}>
                            {attempt.score.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <Link
                          href={`/exam/result/${attempt.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Xem bài
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
