"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  FileCheck,
  Award,
  Clock,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  Layers,
  History,
  BookOpen,
  Send,
  X,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { formatDateTime, formatDuration } from "@/lib/utils";

interface StudentDashboardData {
  studentName: string;
  stats: {
    enrolledClassesCount: number;
    assignedExamsCount: number;
    completedExamsCount: number;
    averageScore: number | null;
  };
  classes: Array<{
    id: string;
    name: string;
    code: string;
    subject: string;
    grade: number;
    teacherName: string;
    studentCode: string | null;
  }>;
  exams: Array<{
    id: string;
    code: string;
    title: string;
    description: string | null;
    durationMinutes: number;
    teacherName: string;
    isCompleted: boolean;
    myScore: number | null;
    attemptId: string | null;
  }>;
  assignments: Array<{
    id: string;
    title: string;
    description: string;
    className: string;
    deadline: string | null;
    isSubmitted: boolean;
    status: string;
    score: number | null;
    feedback: string | null;
  }>;
  recentAttempts: Array<{
    id: string;
    examTitle: string;
    examCode: string;
    score: number | null;
    totalPoints: number | null;
    submittedAt: string | null;
  }>;
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [examCodeInput, setExamCodeInput] = useState("");
  const [classCodeInput, setClassCodeInput] = useState("");
  const [joiningClass, setJoiningClass] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<"exams" | "assignments" | "classes" | "history">("exams");

  // Submit Homework Modal
  const [submitModalAssignment, setSubmitModalAssignment] = useState<{ id: string; title: string; className: string } | null>(null);
  const [homeworkText, setHomeworkText] = useState("");
  const [submittingHomework, setSubmittingHomework] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/student/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Failed to load student dashboard:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const handleJoinExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examCodeInput.trim()) return;
    router.push(`/exam/join?code=${examCodeInput.trim().toUpperCase()}`);
  };

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classCodeInput.trim()) return;

    try {
      setJoiningClass(true);
      const res = await fetch("/api/classes/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: classCodeInput.trim() }),
      });
      const resData = await res.json();
      if (res.ok) {
        alert(resData.message || "Đã gửi yêu cầu vào lớp thành công!");
        setClassCodeInput("");
        loadData();
      } else {
        alert(resData.error || "Không thể tham gia lớp học");
      }
    } catch {
      alert("Lỗi kết nối");
    } finally {
      setJoiningClass(false);
    }
  };

  const handleSubmitHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitModalAssignment || !homeworkText.trim()) return;

    try {
      setSubmittingHomework(true);
      const res = await fetch("/api/assignments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: submitModalAssignment.id,
          textContent: homeworkText.trim(),
        }),
      });

      const resData = await res.json();
      if (res.ok) {
        alert("Đã nộp bài tập thành công!");
        setSubmitModalAssignment(null);
        setHomeworkText("");
        loadData();
      } else {
        alert(resData.error || "Lỗi nộp bài");
      }
    } catch {
      alert("Lỗi kết nối khi nộp bài");
    } finally {
      setSubmittingHomework(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse max-w-6xl mx-auto pb-12">
        <div className="h-32 bg-slate-200 rounded-2xl w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 1. Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-700 p-6 text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-medium text-emerald-100 mb-2 border border-white/20">
              <Sparkles className="h-3.5 w-3.5" />
              Cổng Học Sinh Trực Tuyến
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Chào em, {data?.studentName || "Học sinh"}!
            </h1>
            <p className="text-emerald-100 text-sm mt-1 max-w-xl">
              Chúc em hoàn thành tốt các bài kiểm tra, bài tập về nhà và theo dõi tiến độ học tập!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {/* Quick join exam box */}
            <form
              onSubmit={handleJoinExam}
              className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/20 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Mã đề (VD: 8F3K2A)"
                value={examCodeInput}
                onChange={(e) => setExamCodeInput(e.target.value)}
                className="bg-white text-slate-900 placeholder:text-slate-400 text-xs px-2.5 py-1.5 rounded-lg outline-none w-36 font-mono font-semibold uppercase"
              />
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold shrink-0 text-xs py-1.5"
              >
                Vào thi
              </Button>
            </form>

            {/* Quick join class box */}
            <form
              onSubmit={handleJoinClass}
              className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/20 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Mã lớp (VD: 11B1-LY)"
                value={classCodeInput}
                onChange={(e) => setClassCodeInput(e.target.value)}
                className="bg-white text-slate-900 placeholder:text-slate-400 text-xs px-2.5 py-1.5 rounded-lg outline-none w-36 font-mono font-semibold uppercase"
              />
              <Button
                type="submit"
                size="sm"
                disabled={joiningClass}
                className="bg-blue-500 hover:bg-blue-400 text-white font-semibold shrink-0 text-xs py-1.5"
              >
                Xin vào lớp
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab("classes")}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-blue-400 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Lớp đang học
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-900">
            {data?.stats.enrolledClassesCount ?? 0}
          </div>
        </div>

        <div
          onClick={() => setActiveTab("exams")}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-indigo-400 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Đề thi được giao
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-900">
            {data?.stats.assignedExamsCount ?? 0}
          </div>
        </div>

        <div
          onClick={() => setActiveTab("assignments")}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-emerald-400 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Bài tập về nhà
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <FileCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-900">
            {data?.assignments.length ?? 0}
          </div>
        </div>

        <div
          onClick={() => setActiveTab("history")}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-amber-400 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Điểm trung bình
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-3xl font-bold text-emerald-600">
            {data?.stats.averageScore !== null ? `${data?.stats.averageScore}/10` : "--"}
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("exams")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "exams"
              ? "border-emerald-600 text-emerald-600 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="h-4 w-4" />
          Đề thi trực tuyến ({data?.exams.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("assignments")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "assignments"
              ? "border-blue-600 text-blue-600 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileCheck className="h-4 w-4" />
          Bài tập được giao ({data?.assignments.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("classes")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "classes"
              ? "border-purple-600 text-purple-600 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          Lớp học của tôi ({data?.classes.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "history"
              ? "border-amber-600 text-amber-600 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <History className="h-4 w-4" />
          Lịch sử làm bài & Bảng điểm
        </button>
      </div>

      {/* Tab 1: Exams */}
      {activeTab === "exams" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.exams && data.exams.length > 0 ? (
              data.exams.map((exam) => (
                <div
                  key={exam.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-slate-900 text-base">
                        {exam.title}
                      </span>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {exam.code}
                      </span>
                    </div>
                    {exam.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {exam.description}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDuration(exam.durationMinutes)}
                      </span>
                      <span>• Giáo viên: {exam.teacherName}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    {exam.isCompleted ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="green">Đã hoàn thành</Badge>
                        {exam.myScore !== null && (
                          <span className="text-sm font-bold text-emerald-600">
                            {exam.myScore} điểm
                          </span>
                        )}
                      </div>
                    ) : (
                      <Badge variant="yellow">Chưa làm</Badge>
                    )}

                    <Link href={exam.isCompleted && exam.attemptId ? `/exam/result/${exam.attemptId}` : `/exam/join?code=${exam.code}`}>
                      <Button
                        size="sm"
                        variant={exam.isCompleted ? "outline" : "primary"}
                        className={!exam.isCompleted ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
                      >
                        <span>{exam.isCompleted ? "Xem lại bài thi" : "Bắt đầu làm bài"}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
                Hiện tại không có đề thi nào được giao cho các lớp của em.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Assignments */}
      {activeTab === "assignments" && (
        <div className="space-y-3.5">
          {data?.assignments && data.assignments.length > 0 ? (
            data.assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-base">
                      {assignment.title}
                    </span>
                    <Badge variant="slate">{assignment.className}</Badge>
                  </div>
                  {assignment.description && (
                    <p className="text-xs text-slate-600">{assignment.description}</p>
                  )}
                  {assignment.deadline && (
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Hạn nộp: {formatDateTime(assignment.deadline)}
                    </div>
                  )}
                  {assignment.feedback && (
                    <div className="mt-2 text-xs bg-blue-50 border border-blue-100 rounded-xl p-2.5 text-blue-900">
                      <span className="font-bold">Nhận xét của giáo viên: </span>
                      {assignment.feedback}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {assignment.status === "GRADED" ? (
                    <div className="text-right mr-2">
                      <Badge variant="green">Đã chấm điểm</Badge>
                      {assignment.score !== null && (
                        <div className="font-bold text-emerald-600 text-base mt-0.5">
                          {assignment.score}/10
                        </div>
                      )}
                    </div>
                  ) : assignment.isSubmitted ? (
                    <Badge variant="blue">Đã nộp bài</Badge>
                  ) : (
                    <Badge variant="yellow">Chưa nộp</Badge>
                  )}

                  <Button
                    size="sm"
                    onClick={() => setSubmitModalAssignment({ id: assignment.id, title: assignment.title, className: assignment.className })}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {assignment.isSubmitted ? "Nộp lại bài" : "Nộp bài tập"}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
              Không có bài tập nào cần làm.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Enrolled Classes */}
      {activeTab === "classes" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.classes && data.classes.length > 0 ? (
            data.classes.map((cls) => (
              <div key={cls.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900 text-base">{cls.name}</span>
                    <Badge variant="blue">{cls.subject}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">Khối {cls.grade} • GV: {cls.teacherName}</p>
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Mã lớp:</span>
                    <span className="font-mono font-bold text-slate-800">{cls.code}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  Mã học sinh của em: <span className="font-mono font-semibold text-slate-700">{cls.studentCode || "Chưa cấp"}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
              Em chưa tham gia lớp học nào. Hãy nhập mã lớp ở góc trên để xin vào lớp!
            </div>
          )}
        </div>
      )}

      {/* Tab 4: History & Score Report */}
      {activeTab === "history" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {(!data?.recentAttempts || data.recentAttempts.length === 0) ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              Chưa có lịch sử làm bài thi nào.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Bài thi</th>
                    <th className="px-5 py-3.5">Mã đề</th>
                    <th className="px-5 py-3.5">Thời gian nộp</th>
                    <th className="px-5 py-3.5 text-right">Điểm số</th>
                    <th className="px-5 py-3.5 text-center">Xem lại</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.recentAttempts.map((att) => (
                    <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900">{att.examTitle}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{att.examCode}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {att.submittedAt ? formatDateTime(att.submittedAt) : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-base text-emerald-600">
                        {att.score !== null ? `${att.score}/10` : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <Link
                          href={`/exam/result/${att.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="h-3.5 w-3.5" /> Chi tiết
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Nộp Bài Tập */}
      {submitModalAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-slate-900">Nộp Bài Tập Về Nhà</h2>
              <button onClick={() => setSubmitModalAssignment(null)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              {submitModalAssignment.title} • {submitModalAssignment.className}
            </p>

            <form onSubmit={handleSubmitHomework} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nội dung bài làm / Câu trả lời <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={6}
                  value={homeworkText}
                  onChange={(e) => setHomeworkText(e.target.value)}
                  placeholder="Nhập nội dung bài làm hoặc câu trả lời tự luận của em tại đây..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSubmitModalAssignment(null)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={submittingHomework}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  {submittingHomework ? "Đang gửi..." : "Xác nhận nộp bài"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
