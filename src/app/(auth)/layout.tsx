import React from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 p-4 md:p-8">
      <header className="flex items-center justify-between max-w-5xl mx-auto w-full py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">
            Edu<span className="text-blue-600">Portal</span>
          </span>
        </Link>
        <Link
          href="/"
          className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
        >
          Trang chủ
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center py-6">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="text-center text-xs text-slate-400 py-4">
        © 2026 EduPortal — Nền tảng LMS & Thi Trực Tuyến Độc Lập Chuẩn Quốc Gia
      </footer>
    </div>
  );
}
