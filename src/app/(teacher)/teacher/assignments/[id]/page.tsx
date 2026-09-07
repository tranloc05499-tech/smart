"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  Clock,
  FileText,
  Eye,
  Star,
  MessageSquare,
  X,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

interface Submission {
  id: string;
  status: string;
  submittedAt: string | null;
  student: {
    id: string;
    fullName: string;
    email: string;
  };
  versions: Array<{
    id: string;
    version: number;
    textContent: string | null;
    score: number | null;
    feedback: string | null;
    submittedAt: string;
  }>;
}

interface AssignmentDetail {
  id: string;
  title: string;
  description: string;
  deadline: string | null;
  allowLateSubmission: boolean;
  class: {
    id: string;
    name: string;
    grade: number;
    subject: string;
  };
  submissions: Submission[];
}

export default function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: assignmentId } = use(params);

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [gradingModal, setGradingModal] = useState<{ submission: Submission; version: Submission["versions"][0] } | null>(null);
  const [gradeScore, setGradeScore] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [grading, setGrading] = useState(false);

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/assignments/${assignmentId}`);
      if (res.ok) {
        const data = await res.json();
        setAssignment(data.assignment);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAssignment();
  }, [assignmentId]);

  const openGrading = (submission: Submission) => {
    const latestVersion = submission.versions[0];
    if (!latestVersion) return;
    setGradingModal({ submission, version: latestVersion });
    setGradeScore(latestVersion.score !== null ? String(latestVersion.score) : "");
    setGradeFeedback(latestVersion.feedback || "");
  };

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingModal) return;

    try {
      setGrading(true);
      const res = await fetch(`/api/assignments/submit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: gradingModal.submission.id,
          versionId: gradingModal.version.id,
          score: gradeScore ? Number(gradeScore) : null,
          feedback: gradeFeedback.trim() || null,
          status: "GRADED",
        }),
      });

      if (res.ok) {
        setGradingModal(null);
        fetchAssignment();
      } else {
        const err = await res.json();
        alert(err.error || "Lỗi chấm điểm");
      }
    } catch {
      alert("Lỗi kết nối");
    } finally {
      setGrading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Không tìm thấy bài tập</p>
        <Link href="/teacher/assignments" className="text-blue-600 text-sm mt-2 inline-block">
          ← Về danh sách bài tập
        </Link>
      </div>
    );
  }

  const submittedCount = assignment.submissions.filter((s) => s.status !== "NOT_SUBMITTED").length;
  const gradedCount = assignment.submissions.filter((s) => s.status === "GRADED").length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/teacher/assignments"
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{assignment.title}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Lớp: {assignment.class.name} • Môn: {assignment.class.subject}
              {assignment.deadline && (
                <> • Hạn nộp: {new Date(assignment.deadline).toLocaleDateString("vi-VN")}</>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500 text-right">
            <div className="font-bold text-slate-800 text-lg">{submittedCount}</div>
            <div>bài đã nộp</div>
          </div>
          <div className="text-xs text-slate-500 text-right">
            <div className="font-bold text-emerald-600 text-lg">{gradedCount}</div>
            <div>đã chấm</div>
          </div>
        </div>
      </div>

      {/* Assignment description */}
      {assignment.description && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-900">
          <span className="font-semibold">Yêu cầu: </span>
          {assignment.description}
        </div>
      )}

      {/* Submissions table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/80">
          <h2 className="font-semibold text-sm text-slate-800">Danh sách bài nộp ({assignment.submissions.length})</h2>
        </div>

        {assignment.submissions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            Chưa có học sinh nào nộp bài.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Học sinh</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5">Thời gian nộp</th>
                  <th className="px-5 py-3.5 text-right">Điểm</th>
                  <th className="px-5 py-3.5 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignment.submissions.map((sub) => {
                  const latest = sub.versions[0];
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">{sub.student.fullName}</div>
                        <div className="text-xs text-slate-400">{sub.student.email}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge
                          variant={
                            sub.status === "GRADED"
                              ? "green"
                              : sub.status === "SUBMITTED"
                              ? "blue"
                              : "yellow"
                          }
                          className="text-xs"
                        >
                          {sub.status === "GRADED"
                            ? "Đã chấm"
                            : sub.status === "SUBMITTED"
                            ? "Đã nộp"
                            : "Chờ nộp"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {latest?.submittedAt
                          ? new Date(latest.submittedAt).toLocaleString("vi-VN")
                          : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-base">
                        {latest?.score !== null && latest?.score !== undefined ? (
                          <span className="text-emerald-600">{latest.score}/10</span>
                        ) : (
                          <span className="text-slate-400 font-normal text-xs">Chưa chấm</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {latest ? (
                          <button
                            onClick={() => openGrading(sub)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            {sub.status === "GRADED" ? "Xem / Sửa điểm" : "Chấm bài"}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-300">Chưa nộp</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grading Modal */}
      {gradingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 my-8">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-slate-900">Chấm Bài Tập</h2>
              <button onClick={() => setGradingModal(null)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              {gradingModal.submission.student.fullName} • {assignment.title}
            </p>

            {/* Student submission */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
              <p className="text-xs font-semibold text-slate-500 mb-2">NỘI DUNG BÀI LÀM:</p>
              <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                {gradingModal.version.textContent || "Không có nội dung văn bản"}
              </p>
            </div>

            <form onSubmit={handleGrade} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Điểm số (thang 10)
                  </label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={gradeScore}
                    onChange={(e) => setGradeScore(e.target.value)}
                    placeholder="VD: 8.5"
                    className="text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nhận xét của giáo viên
                </label>
                <textarea
                  rows={3}
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  placeholder="Nhập nhận xét, góp ý cho học sinh..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setGradingModal(null)}>
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={grading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                >
                  <Save className="h-4 w-4" />
                  {grading ? "Đang lưu..." : "Lưu điểm & Nhận xét"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
