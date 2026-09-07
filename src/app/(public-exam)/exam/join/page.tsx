"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FileText,
  Clock,
  User,
  ArrowRight,
  BookOpen,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatDuration } from "@/lib/utils";

interface ExamInfo {
  id: string;
  code: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  questionCount: number;
  teacherName: string;
  requireLogin: boolean;
  antiCheatLevel: number;
}

function ExamJoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("code") || "";

  const [code, setCode] = useState(initialCode);
  const [examInfo, setExamInfo] = useState<ExamInfo | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Student info form
  const [studentName, setStudentName] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [className, setClassName] = useState("");

  const verifyExamCode = async (examCodeToVerify: string) => {
    if (!examCodeToVerify.trim()) return;
    setIsVerifying(true);
    setVerifyError(null);

    try {
      const res = await fetch(`/api/exams/verify?code=${encodeURIComponent(examCodeToVerify.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        setVerifyError(data.error || "Mã đề thi không hợp lệ");
        setExamInfo(null);
      } else {
        setExamInfo(data);
      }
    } catch {
      setVerifyError("Lỗi kết nối máy chủ");
      setExamInfo(null);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (!initialCode) return;
    let isCancelled = false;

    fetch(`/api/exams/verify?code=${encodeURIComponent(initialCode.trim())}`)
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (isCancelled) return;
        if (!ok) {
          setVerifyError(data.error || "Mã đề thi không hợp lệ");
          setExamInfo(null);
        } else {
          setExamInfo(data);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setVerifyError("Lỗi kết nối máy chủ");
          setExamInfo(null);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [initialCode]);

  const [isStarting, setIsStarting] = useState(false);

  const handleStartExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examInfo || isStarting) return;
    if (!studentName.trim()) {
      alert("Vui lòng nhập Họ và tên của em trước khi bắt đầu.");
      return;
    }

    setIsStarting(true);
    try {
      const res = await fetch("/api/exam-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examCode: examInfo.code,
          studentName: studentName.trim(),
          studentCode: studentCode.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Không thể bắt đầu bài thi");
        setIsStarting(false);
        return;
      }
      // Store attempt in sessionStorage for the exam room
      sessionStorage.setItem("exam_attempt", JSON.stringify(data));
      router.push("/exam/room");
    } catch {
      alert("Lỗi kết nối. Vui lòng thử lại.");
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-blue-50/40 p-4 md:p-8 flex flex-col justify-between">
      <header className="flex items-center justify-between max-w-4xl mx-auto w-full py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">
            Edu<span className="text-blue-600">Portal</span>
          </span>
        </Link>
        <Link
          href="/login"
          className="text-sm font-medium text-slate-600 hover:text-blue-600"
        >
          Đăng nhập tài khoản
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center py-6">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-100 p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-emerald-50 text-emerald-600 mb-3">
              <FileText className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Phòng Thi Trực Tuyến
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Tham gia làm bài thi qua mã đề do giáo viên cung cấp
            </p>
          </div>

          {/* 1. Enter Exam Code */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Mã đề thi (6 ký tự)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="VD: 8F3K2A"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="flex-1 font-mono text-lg tracking-wider font-bold uppercase rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <Button
                type="button"
                onClick={() => verifyExamCode(code)}
                isLoading={isVerifying}
                className="px-5 bg-blue-600 hover:bg-blue-700"
              >
                Tìm đề
              </Button>
            </div>
          </div>

          {verifyError && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-3.5 text-sm text-red-700 flex items-center gap-2">
              <span>⚠️</span>
              <span>{verifyError}</span>
            </div>
          )}

          {/* 2. Verified Exam Info Card */}
          {examInfo && (
            <div className="mb-6 p-5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Badge variant="green">Đề thi hợp lệ</Badge>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">
                    {examInfo.title}
                  </h2>
                </div>
                <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-white text-emerald-800 border border-emerald-200">
                  {examInfo.code}
                </span>
              </div>

              {examInfo.description && (
                <p className="text-xs text-slate-600">{examInfo.description}</p>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-100 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  <span>Thời gian: <strong>{formatDuration(examInfo.durationMinutes)}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4 text-emerald-600" />
                  <span>Giáo viên: <strong>{examInfo.teacherName}</strong></span>
                </div>
              </div>

              {examInfo.antiCheatLevel > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                  <span>Chế độ giám sát: Hệ thống sẽ phát hiện hành vi chuyển tab trình duyệt.</span>
                </div>
              )}
            </div>
          )}

          {/* 3. Student Registration Form */}
          {examInfo && (
            <form onSubmit={handleStartExam} className="space-y-4 pt-2 border-t border-slate-100">
              <div className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2">
                Thông tin thí sinh làm bài
              </div>

              <Input
                label="Họ và tên học sinh"
                type="text"
                placeholder="Nguyễn Văn A"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Số báo danh / Mã HS"
                  type="text"
                  placeholder="HS001 hoặc SBD 12"
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                />
                <Input
                  label="Lớp học"
                  type="text"
                  placeholder="12A1"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                className="w-full mt-4 h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
              >
                <span>Bắt đầu làm bài</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-slate-400">
            Học sinh có tài khoản?{" "}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              Đăng nhập để tự động lưu hồ sơ học tập
            </Link>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-slate-400 py-4">
        © 2026 EduPortal — Phòng thi trực tuyến đồng bộ server-side và autosave liên tục.
      </footer>
    </div>
  );
}

export default function ExamJoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      }
    >
      <ExamJoinContent />
    </Suspense>
  );
}
