"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Users,
  FileText,
  FileCheck,
  PlusCircle,
  Share2,
  Clock,
  ArrowUpRight,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";

interface DashboardData {
  teacherName: string;
  stats: {
    totalClasses: number;
    totalStudents: number;
    totalExams: number;
    totalQuestions: number;
  };
  activeAssignments: Array<{
    id: string;
    title: string;
    className: string;
    submittedCount: number;
    totalStudents: number;
    deadline: string | null;
  }>;
  recentExams: Array<{
    id: string;
    code: string;
    title: string;
    durationMinutes: number;
    status: string;
    attemptsCount: number;
    averageScore: number | null;
    createdAt: string;
  }>;
  classes: Array<{
    id: string;
    name: string;
    code: string;
    subject: string;
    grade: number;
    studentsCount: number;
    assignmentsCount: number;
  }>;
}

export default function TeacherDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/teacher/dashboard");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error("Failed to load dashboard data:", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCopyExamLink = (code: string) => {
    const url = `${window.location.origin}/exam/join?code=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-slate-200 rounded-2xl w-full" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200 rounded-2xl" />
          <div className="h-80 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Header Command Center */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Xin chào, {data?.teacherName || "Thầy Cô"}! 👋
            </h1>
            <Badge variant="blue">Trung tâm chỉ huy</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Hôm nay là {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}. Sẵn sàng giao bài và kiểm tra đánh giá.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/teacher/assignments">
            <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-50">
              <PlusCircle className="h-4 w-4" />
              <span>Giao bài tập</span>
            </Button>
          </Link>
          <Link href="/teacher/exams">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20">
              <PlusCircle className="h-4 w-4" />
              <span>Tạo đề thi mới</span>
            </Button>
          </Link>
          <Link href="/teacher/classes">
            <Button variant="secondary" size="sm">
              <GraduationCap className="h-4 w-4" />
              <span>Tạo lớp học</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Top Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Lớp phụ trách
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">
              {data?.stats.totalClasses ?? 0}
            </span>
            <span className="text-xs text-slate-400">lớp đang mở</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tổng số học sinh
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">
              {data?.stats.totalStudents ?? 0}
            </span>
            <span className="text-xs text-emerald-600 font-medium">HS đã ghi danh</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Đề thi đã tạo
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">
              {data?.stats.totalExams ?? 0}
            </span>
            <span className="text-xs text-slate-400">đề thi sẵn sàng</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Ngân hàng câu hỏi
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <HelpCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">
              {data?.stats.totalQuestions ?? 0}
            </span>
            <span className="text-xs text-slate-400">câu hỏi lưu trữ</span>
          </div>
        </div>
      </div>

      {/* 3. Main Grid: Active Assignments vs Recent Exams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Active Assignments */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-blue-600" />
                <h2 className="font-bold text-slate-900 text-lg">
                  Bài tập đang hoạt động
                </h2>
              </div>
              <Link
                href="/teacher/assignments"
                className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-0.5"
              >
                <span>Xem tất cả</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-3.5">
              {data?.activeAssignments && data.activeAssignments.length > 0 ? (
                data.activeAssignments.map((assignment) => {
                  const percent =
                    assignment.totalStudents > 0
                      ? Math.round(
                          (assignment.submittedCount / assignment.totalStudents) * 100
                        )
                      : 0;

                  return (
                    <div
                      key={assignment.id}
                      className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-slate-800 text-sm">
                            {assignment.title}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="slate">{assignment.className}</Badge>
                            {assignment.deadline && (
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Hạn: {formatDateTime(assignment.deadline)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-bold text-blue-700 text-sm">
                            {assignment.submittedCount}/{assignment.totalStudents}
                          </span>
                          <span className="text-xs text-slate-500 block">đã nộp</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3 w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, percent)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Chưa có bài tập nào đang giao. Bấm &quot;Giao bài tập&quot; để tạo bài mới.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
            <Link href="/teacher/assignments/create">
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                + Giao bài tập mới
              </Button>
            </Link>
          </div>
        </div>

        {/* Right: Recent Exams */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                <h2 className="font-bold text-slate-900 text-lg">Đề thi gần đây</h2>
              </div>
              <Link
                href="/teacher/exams"
                className="text-xs font-medium text-indigo-600 hover:underline flex items-center gap-0.5"
              >
                <span>Xem tất cả</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-3.5">
              {data?.recentExams && data.recentExams.length > 0 ? (
                data.recentExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 text-sm truncate">
                        {exam.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {exam.code}
                        </span>
                        <span>⏱ {exam.durationMinutes} phút</span>
                        <span>• {exam.attemptsCount} lượt thi</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {exam.averageScore !== null ? (
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block">Điểm TB</span>
                          <span className="text-base font-bold text-emerald-600">
                            {exam.averageScore}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="yellow">Chưa có điểm</Badge>
                      )}

                      <button
                        type="button"
                        onClick={() => handleCopyExamLink(exam.code)}
                        title="Copy link làm bài thi"
                        className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors"
                      >
                        {copiedCode === exam.code ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Share2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Chưa có đề thi nào. Bấm &quot;Tạo đề thi mới&quot; để tạo đề.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
            <Link href="/teacher/exams/create">
              <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700">
                + Tạo đề thi mới
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Active Classes Overview */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            <h2 className="font-bold text-slate-900 text-lg">
              Danh sách lớp học phụ trách
            </h2>
          </div>
          <Link href="/teacher/classes">
            <Button variant="outline" size="sm">
              Quản lý tất cả lớp
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data?.classes && data.classes.length > 0 ? (
            data.classes.map((cls) => (
              <div
                key={cls.id}
                className="p-5 rounded-xl border border-slate-200 bg-white hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="font-bold text-slate-900 text-base">
                      {cls.name}
                    </span>
                    <Badge variant="blue">Khối {cls.grade}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-slate-500 font-mono">
                    Mã lớp: <span className="font-semibold text-slate-700">{cls.code}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>👥 {cls.studentsCount} học sinh</span>
                  <span>📝 {cls.assignmentsCount} bài tập</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-6 text-slate-400 text-sm">
              Chưa có lớp nào được tạo.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
