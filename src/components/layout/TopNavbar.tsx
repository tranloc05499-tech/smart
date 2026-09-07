"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon, Sparkles, BookOpen } from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";

interface TopNavbarProps {
  user: {
    fullName: string;
    email: string;
    role: string;
    avatar?: string | null;
  };
}

type BadgeVariant = "blue" | "green" | "yellow" | "purple" | "red" | "slate";

export function TopNavbar({ user }: TopNavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  const roleLabel =
    user.role === "SUPER_ADMIN"
      ? "Quản trị viên"
      : user.role === "TEACHER"
      ? "Giáo viên"
      : "Học sinh";

  const roleVariant: BadgeVariant =
    user.role === "SUPER_ADMIN"
      ? "red"
      : user.role === "TEACHER"
      ? "blue"
      : "green";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/90 px-6 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold text-slate-900 tracking-tight">
            Edu<span className="text-blue-600">Portal</span>
          </span>
        </Link>
        <span className="text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium border border-blue-100 hidden sm:inline-block">
          LMS & Exam Engine
        </span>
      </div>

      <div className="flex items-center gap-3">
        {user.role === "TEACHER" && (
          <Link href="/teacher/exams">
            <Button size="sm" className="hidden sm:inline-flex bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Sparkles className="h-4 w-4 mr-1 text-amber-300" />
              Tạo đề nhanh
            </Button>
          </Link>
        )}

        <div className="flex items-center gap-3 border-l border-slate-200 pl-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt={user.fullName}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <UserIcon className="h-4 w-4" />
              )}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-semibold text-slate-800 leading-tight">
                {user.fullName}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant={roleVariant}>{roleLabel}</Badge>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            title="Đăng xuất"
            className="text-slate-500 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
