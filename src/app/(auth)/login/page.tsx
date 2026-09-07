"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, UserCheck, GraduationCap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get("role") || "TEACHER";

  const [identifier, setIdentifier] = useState(
    defaultRole === "TEACHER" ? "teacher@edutech.vn" : "student1@edutech.vn"
  );
  const [password, setPassword] = useState("123456");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Đăng nhập không thành công");
        setIsLoading(false);
        return;
      }

      // Redirect based on user role
      if (data.user.role === "TEACHER" || data.user.role === "SUPER_ADMIN") {
        router.push("/teacher/dashboard");
      } else {
        router.push("/student/dashboard");
      }
      router.refresh();
    } catch {
      setError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (email: string, pass: string) => {
    setIdentifier(email);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Đăng nhập hệ thống
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Truy cập nền tảng quản lý học tập & thi trực tuyến
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl bg-red-50 border border-red-200 p-3.5 text-sm text-red-700 flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            label="Email hoặc Số điện thoại"
            type="text"
            placeholder="teacher@edutech.vn hoặc 0901234567"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-slate-700">Mật khẩu</label>
            <Link
              href="/forgot-password"
              className="text-xs text-blue-600 hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full mt-2 h-11 text-base shadow-md shadow-blue-500/20"
          isLoading={isLoading}
        >
          <span>Đăng nhập</span>
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </form>

      {/* 1-Click Demo Accounts */}
      <div className="mt-6 pt-6 border-t border-slate-100">
        <div className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2.5 text-center">
          Tài khoản dùng thử (1-Click)
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickLogin("teacher@edutech.vn", "123456")}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-100/60 text-blue-800 transition-colors text-xs font-medium"
          >
            <UserCheck className="h-4 w-4 mb-1 text-blue-600" />
            <span>Thầy An</span>
            <span className="text-[10px] text-blue-500 font-normal">Giáo viên</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin("student1@edutech.vn", "123456")}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-100/60 text-emerald-800 transition-colors text-xs font-medium"
          >
            <GraduationCap className="h-4 w-4 mb-1 text-emerald-600" />
            <span>Minh Anh</span>
            <span className="text-[10px] text-emerald-500 font-normal">Học sinh</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin("admin@edutech.vn", "123456")}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-purple-100 bg-purple-50/50 hover:bg-purple-100/60 text-purple-800 transition-colors text-xs font-medium"
          >
            <ShieldCheck className="h-4 w-4 mb-1 text-purple-600" />
            <span>Quản trị</span>
            <span className="text-[10px] text-purple-500 font-normal">Admin</span>
          </button>
        </div>
      </div>

      <div className="mt-6 text-center text-sm text-slate-500">
        Chưa có tài khoản?{" "}
        <Link
          href="/register"
          className="font-semibold text-blue-600 hover:underline"
        >
          Đăng ký ngay
        </Link>
      </div>

      <div className="mt-3 text-center">
        <Link
          href="/exam/join"
          className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200"
        >
          <span>🎯 Vào thi trực tiếp bằng mã đề</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
