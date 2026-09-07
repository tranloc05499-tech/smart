"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, GraduationCap, School } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"TEACHER" | "STUDENT">("TEACHER");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim().length < 2) {
      setError("Họ tên phải có ít nhất 2 ký tự");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Đăng ký không thành công");
        setIsLoading(false);
        return;
      }

      if (role === "TEACHER") {
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

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Đăng ký tài khoản
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Bắt đầu giảng dạy và học tập hiệu quả cùng EduPortal
        </p>
      </div>

      {/* Role Selector Tabs */}
      <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
        <button
          type="button"
          onClick={() => setRole("TEACHER")}
          className={cn(
            "flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all",
            role === "TEACHER"
              ? "bg-white text-blue-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          <School className="h-4 w-4" />
          <span>Tôi là Giáo viên</span>
        </button>
        <button
          type="button"
          onClick={() => setRole("STUDENT")}
          className={cn(
            "flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all",
            role === "STUDENT"
              ? "bg-white text-emerald-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          <GraduationCap className="h-4 w-4" />
          <span>Tôi là Học sinh</span>
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-xl bg-red-50 border border-red-200 p-3.5 text-sm text-red-700 flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Họ và tên"
          type="text"
          placeholder={role === "TEACHER" ? "Thầy Nguyễn Văn A" : "Nguyễn Văn B"}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <Input
          label="Địa chỉ Email"
          type="email"
          placeholder="example@school.edu.vn"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Số điện thoại (tùy chọn)"
          type="tel"
          placeholder="0912345678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <Input
          label="Mật khẩu"
          type="password"
          placeholder="Tối thiểu 6 ký tự"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button
          type="submit"
          className="w-full mt-2 h-11 text-base shadow-md shadow-blue-500/20"
          isLoading={isLoading}
        >
          <span>Tạo tài khoản</span>
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-500">
        Đã có tài khoản?{" "}
        <Link
          href="/login"
          className="font-semibold text-blue-600 hover:underline"
        >
          Đăng nhập
        </Link>
      </div>
    </div>
  );
}
