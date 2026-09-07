"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  BookOpen,
  FileText,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  Search,
  Copy,
  Check,
  UserCheck,
  UserX,
  GraduationCap,
  LinkIcon,
  Unlink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

interface StudentItem {
  id: string;
  memberId: string;
  studentId: string;
  fullName: string;
  studentCode: string;
  email: string;
  phone: string | null;
  status: "ACTIVE" | "PENDING" | "SUSPENDED";
  joinedAt: string;
}

interface ExamOption {
  id: string;
  title: string;
  code: string;
  durationMinutes: number;
  status: string;
  _count: { questions: number };
}

interface ClassDetail {
  id: string;
  name: string;
  code: string;
  subject: string;
  grade: number;
  schoolYear: string;
  description: string | null;
  teacherName: string;
  students: StudentItem[];
  assignments: { id: string; title: string; deadline: string | null; submittedCount: number; totalStudents: number }[];
  exams: { id: string; code: string; title: string; durationMinutes: number; status: string; attemptsCount: number }[];
}

export default function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: classId } = use(params);

  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<"students" | "exams" | "assignments">("students");

  // Add student modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [adding, setAdding] = useState(false);

  // Assign exam modal
  const [showAssignExamModal, setShowAssignExamModal] = useState(false);
  const [availableExams, setAvailableExams] = useState<ExamOption[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [assigningExamId, setAssigningExamId] = useState<string | null>(null);

  const fetchAvailableExams = async () => {
    try {
      setLoadingExams(true);
      const res = await fetch("/api/exams");
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.data || [];
        setAvailableExams(items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingExams(false);
    }
  };

  const handleAssignExam = async (examId: string) => {
    try {
      setAssigningExamId(examId);
      // Check if already assigned
      const isAssigned = classData?.exams.some(e => e.id === examId);
      if (isAssigned) {
        const res = await fetch(`/api/exams/${examId}/classes`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ classId }),
        });
        if (res.ok) fetchClassDetail();
      } else {
        const res = await fetch(`/api/exams/${examId}/classes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ classIds: [classId] }),
        });
        if (res.ok) fetchClassDetail();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAssigningExamId(null);
    }
  };

  const fetchClassDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/classes/${classId}`);
      if (res.ok) {
        const data = await res.json();
        setClassData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassDetail();
  }, [classId]);

  const copyCode = () => {
    if (!classData) return;
    navigator.clipboard.writeText(classData.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) return;

    try {
      setAdding(true);
      const res = await fetch(`/api/classes/${classId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: studentName.trim(),
          email: studentEmail.trim() || undefined,
          studentCode: studentCode.trim() || undefined,
          phone: studentPhone.trim() || undefined,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setStudentName("");
        setStudentEmail("");
        setStudentCode("");
        setStudentPhone("");
        fetchClassDetail();
      } else {
        const err = await res.json();
        alert(err.error || "Không thể thêm học sinh");
      }
    } catch {
      alert("Lỗi kết nối");
    } finally {
      setAdding(false);
    }
  };

  const handleUpdateStatus = async (memberId: string, status: "ACTIVE" | "SUSPENDED" | "PENDING") => {
    try {
      const res = await fetch(`/api/classes/${classId}/students`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, status }),
      });
      if (res.ok) {
        fetchClassDetail();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveStudent = async (memberId: string, name: string) => {
    if (!confirm(`Xoá học sinh "${name}" khỏi lớp học này?`)) return;
    try {
      const res = await fetch(`/api/classes/${classId}/students?memberId=${memberId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchClassDetail();
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

  if (!classData) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Không tìm thấy thông tin lớp học</p>
        <Link href="/teacher/classes" className="text-blue-600 text-sm mt-2 inline-block">
          ← Về danh sách lớp
        </Link>
      </div>
    );
  }

  const pendingStudents = classData.students.filter((s) => s.status === "PENDING");
  const activeStudents = classData.students.filter((s) => s.status !== "PENDING");

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/teacher/classes"
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{classData.name}</h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                {classData.subject} • Lớp {classData.grade}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Năm học: {classData.schoolYear} • Giáo viên phụ trách: {classData.teacherName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Join code pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-800">
            <span>Mã lớp: {classData.code}</span>
            <button
              onClick={copyCode}
              className="p-1 rounded hover:bg-white text-slate-500 transition-colors"
              title="Sao chép mã lớp cho học sinh"
            >
              {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>

          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Thêm học sinh
          </Button>

          <Button
            onClick={() => { setShowAssignExamModal(true); fetchAvailableExams(); }}
            variant="outline"
            className="text-xs gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            <LinkIcon className="h-4 w-4" />
            Gán đề thi
          </Button>
        </div>
      </div>

      {/* Pending Approval Alert */}
      {pendingStudents.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
              <Clock className="h-4 w-4" />
              Có {pendingStudents.length} học sinh đang chờ duyệt vào lớp bằng mã lớp:
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {pendingStudents.map((s) => (
              <div key={s.id} className="bg-white p-3 rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-slate-900">{s.fullName}</div>
                  <div className="text-xs text-slate-500">{s.email}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleUpdateStatus(s.memberId, "ACTIVE")}
                    title="Duyệt vào lớp"
                    className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  >
                    <UserCheck className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleRemoveStudent(s.memberId, s.fullName)}
                    title="Từ chối"
                    className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    <UserX className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("students")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "students"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="h-4 w-4" />
          Danh sách học sinh ({classData.students.length})
        </button>

        <button
          onClick={() => setActiveTab("exams")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "exams"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="h-4 w-4" />
          Đề thi đã gán ({classData.exams.length})
        </button>

        <button
          onClick={() => setActiveTab("assignments")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "assignments"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Bài tập ({classData.assignments.length})
        </button>
      </div>

      {/* Tab 1: Students */}
      {activeTab === "students" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {classData.students.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              Lớp học chưa có học sinh nào. Hãy nhấn &quot;Thêm học sinh&quot; hoặc gửi mã lớp <span className="font-mono font-bold text-slate-800">{classData.code}</span> cho học sinh.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">#</th>
                    <th className="px-5 py-3.5">Học sinh</th>
                    <th className="px-5 py-3.5">Mã HS / SBD</th>
                    <th className="px-5 py-3.5">Email</th>
                    <th className="px-5 py-3.5">Trạng thái</th>
                    <th className="px-5 py-3.5 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classData.students.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 text-slate-400 text-xs">{idx + 1}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900">{s.fullName}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{s.studentCode || "—"}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">{s.email}</td>
                      <td className="px-5 py-3.5">
                        <Badge
                          variant={
                            s.status === "ACTIVE"
                              ? "green"
                              : s.status === "PENDING"
                              ? "yellow"
                              : "red"
                          }
                          className="text-[11px]"
                        >
                          {s.status === "ACTIVE"
                            ? "Đang học"
                            : s.status === "PENDING"
                            ? "Chờ duyệt"
                            : "Tạm dừng"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => handleRemoveStudent(s.memberId, s.fullName)}
                          className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg transition-colors"
                          title="Xóa học sinh khỏi lớp"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Exams */}
      {activeTab === "exams" && (
        <div className="space-y-4">
          {classData.exams.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-sm">
              Chưa có đề thi nào được gán cho lớp này.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classData.exams.map((ex) => (
                <div key={ex.id} className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {ex.code}
                      </span>
                      <Badge variant={ex.status === "PUBLISHED" ? "green" : "slate"}>
                        {ex.status === "PUBLISHED" ? "Đang mở" : "Bản nháp"}
                      </Badge>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">{ex.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">Thời gian làm bài: {ex.durationMinutes} phút</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>{ex.attemptsCount} lượt nộp bài</span>
                    <Link href={`/teacher/exams/${ex.id}/results`} className="text-blue-600 hover:underline font-semibold">
                      Xem kết quả →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Assignments */}
      {activeTab === "assignments" && (
        <div className="space-y-4">
          {classData.assignments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-sm">
              Chưa có bài tập nào được giao cho lớp này.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classData.assignments.map((ass) => (
                <div key={ass.id} className="bg-white p-5 rounded-2xl border border-slate-200">
                  <h3 className="font-bold text-slate-900 text-sm">{ass.title}</h3>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>Hạn nộp: {ass.deadline ? new Date(ass.deadline).toLocaleDateString("vi-VN") : "Không hạn"}</span>
                    <span className="font-semibold text-slate-700">{ass.submittedCount}/{ass.totalStudents} bài nộp</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Thêm Học Sinh */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Thêm Học Sinh Vào Lớp</h2>
            <p className="text-xs text-slate-500 mb-4">
              Tạo tài khoản hoặc thêm học sinh sẵn có vào lớp {classData.name}
            </p>

            <form onSubmit={handleAddStudent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên học sinh <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="VD: Nguyễn Văn Nam"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mã học sinh / Số báo danh
                </label>
                <Input
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  placeholder="VD: HS001"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email học sinh (Tùy chọn)
                </label>
                <Input
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="student@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số điện thoại phụ huynh / học sinh
                </label>
                <Input
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                  placeholder="0987654321"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={adding}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {adding ? "Đang thêm..." : "Thêm vào lớp"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Gán Đề Thi Cho Lớp */}
      {showAssignExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 my-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Gán Đề Thi Cho Lớp</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chọn đề thi để gán / bỏ gán cho lớp <span className="font-semibold">{classData?.name}</span>
                </p>
              </div>
              <button
                onClick={() => setShowAssignExamModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >✕</button>
            </div>

            {loadingExams ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-7 w-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : availableExams.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                Chưa có đề thi nào. Hãy tạo đề thi trước tại trang Quản lý Đề thi.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {availableExams.map((exam) => {
                  const isAssigned = classData?.exams.some(e => e.id === exam.id);
                  const isLoading = assigningExamId === exam.id;
                  return (
                    <div
                      key={exam.id}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                        isAssigned
                          ? "bg-indigo-50 border-indigo-200"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                            {exam.code}
                          </span>
                          <Badge variant={exam.status === "PUBLISHED" ? "green" : "slate"} className="text-[10px]">
                            {exam.status === "PUBLISHED" ? "Đang mở" : "Bản nháp"}
                          </Badge>
                        </div>
                        <p className="font-semibold text-sm text-slate-800 mt-1 truncate">{exam.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{exam.durationMinutes} phút • {exam._count?.questions ?? 0} câu hỏi</p>
                      </div>
                      <button
                        onClick={() => handleAssignExam(exam.id)}
                        disabled={isLoading}
                        className={`ml-3 shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                          isAssigned
                            ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                            : "bg-indigo-600 text-white hover:bg-indigo-700"
                        }`}
                      >
                        {isLoading ? "..." : isAssigned ? "Bỏ gán" : "Gán vào lớp"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
              <Button variant="outline" onClick={() => setShowAssignExamModal(false)}>
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
